"""Cross-platform, deterministic validation for the BobSwarm demo fixture.

The default run proves that the fixture still contains the two intentional
defect classes the swarm is expected to find. Pass ``--report`` with a JSON
result returned by ``finalize_run`` to validate a real swarm run as well.

Usage:
    python demo/validate_demo.py
    python demo/validate_demo.py --report path/to/final-report.json
"""

from __future__ import annotations

import argparse
import ast
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest


DEMO_DIR = Path(__file__).resolve().parent
REPO_ROOT = DEMO_DIR.parent
PROJECT_DIR = DEMO_DIR / "sample-project"
APP_PATH = PROJECT_DIR / "app.py"
UTILS_PATH = PROJECT_DIR / "utils.py"
INPUT_PATH = PROJECT_DIR / "data" / "input.json"
EXPECTED_PATH = DEMO_DIR / "expected_output.md"

REQUIRED_ROLES = {"debugger", "documenter", "refactorer", "onboarding", "data_lineage"}
VALID_SEVERITIES = {"breaks", "warns", "informational"}


def _load_app_with_failing_requests():
    """Load the fixture without requiring the third-party requests package."""

    fake_requests = types.ModuleType("requests")

    def fail_request(*_args, **_kwargs):
        raise ConnectionError("deterministic demo enrichment failure")

    fake_requests.get = fail_request
    previous = sys.modules.get("requests")
    sys.modules["requests"] = fake_requests
    try:
        spec = importlib.util.spec_from_file_location("bobswarm_demo_fixture", APP_PATH)
        if spec is None or spec.loader is None:
            raise RuntimeError(f"could not load {APP_PATH}")
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        return module
    finally:
        if previous is None:
            sys.modules.pop("requests", None)
        else:
            sys.modules["requests"] = previous


def _function(tree: ast.AST, name: str) -> ast.FunctionDef:
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name == name:
            return node
    raise AssertionError(f"missing expected function: {name}")


def _direct_open_calls(function: ast.FunctionDef) -> list[ast.Call]:
    return [
        node
        for node in ast.walk(function)
        if isinstance(node, ast.Call)
        and isinstance(node.func, ast.Name)
        and node.func.id == "open"
    ]


class DemoFixtureTests(unittest.TestCase):
    """Protect both the runnable baseline and the intentionally broken targets."""

    @classmethod
    def setUpClass(cls):
        cls.source = APP_PATH.read_text(encoding="utf-8")
        cls.tree = ast.parse(cls.source, filename=str(APP_PATH))

    def test_required_demo_files_exist(self):
        for path in (APP_PATH, UTILS_PATH, INPUT_PATH, EXPECTED_PATH):
            with self.subTest(path=path):
                self.assertTrue(path.is_file(), f"missing demo file: {path}")

    def test_input_fixture_contains_a_processable_record(self):
        records = json.loads(INPUT_PATH.read_text(encoding="utf-8"))
        self.assertIsInstance(records, list)
        self.assertGreater(len(records), 0)
        self.assertTrue(any("@" in record.get("email", "") for record in records))

    def test_enrichment_failure_still_returns_none(self):
        app = _load_app_with_failing_requests()
        self.assertIsNone(app.enrich_record({"id": "demo-1"}, "http://demo.invalid"))

    def test_enrichment_failure_still_breaks_the_pipeline(self):
        app = _load_app_with_failing_requests()
        with tempfile.TemporaryDirectory(prefix="bobswarm-demo-") as temp_dir:
            output_path = Path(temp_dir) / "output.json"
            with self.assertRaises(AttributeError):
                app.run_pipeline(str(INPUT_PATH), str(output_path), "http://demo.invalid")
            self.assertFalse(output_path.exists())

    def test_intentional_unmanaged_file_opens_are_preserved(self):
        for function_name in ("load_records", "save_results"):
            with self.subTest(function=function_name):
                function = _function(self.tree, function_name)
                self.assertEqual(len(_direct_open_calls(function)), 1)
                self.assertFalse(
                    any(isinstance(node, (ast.With, ast.AsyncWith)) for node in ast.walk(function)),
                    f"{function_name} is intentionally expected to omit a context manager",
                )

    def test_expected_output_names_every_verified_target(self):
        expected = EXPECTED_PATH.read_text(encoding="utf-8")
        for marker in (
            "BUG-01",
            "BUG-02",
            "BUG-03",
            "`enrich_record`",
            "`run_pipeline`",
            "`load_records`",
            "`save_results`",
        ):
            with self.subTest(marker=marker):
                self.assertIn(marker, expected)


def _resolve_evidence_path(raw_path: str) -> Path:
    candidate = Path(raw_path)
    if not candidate.is_absolute():
        candidate = REPO_ROOT / candidate
    resolved = candidate.resolve()
    sample_root = PROJECT_DIR.resolve()
    if resolved != sample_root and sample_root not in resolved.parents:
        raise AssertionError(f"finding path escapes the demo fixture: {raw_path}")
    if not resolved.is_file():
        raise AssertionError(f"finding path does not exist: {raw_path}")
    return resolved


def validate_swarm_report(report_path: Path) -> None:
    """Validate structure, literal evidence, roles, and required defect coverage."""

    report = json.loads(report_path.read_text(encoding="utf-8"))
    if "report" in report and isinstance(report["report"], dict):
        report = report["report"]
    findings_by_role = report.get("findingsByRole")
    if not isinstance(findings_by_role, dict):
        raise AssertionError("report must contain a findingsByRole object")

    missing_roles = REQUIRED_ROLES - set(findings_by_role)
    if missing_roles:
        raise AssertionError(f"report is missing specialist findings: {sorted(missing_roles)}")

    all_findings = []
    for role, findings in findings_by_role.items():
        if not isinstance(findings, list) or not findings:
            raise AssertionError(f"{role} must provide at least one source-backed finding")
        for finding in findings:
            if finding.get("subagentRole") != role:
                raise AssertionError(f"finding role mismatch in {role}")
            if finding.get("severity") not in VALID_SEVERITIES:
                raise AssertionError(f"invalid severity in {role}: {finding.get('severity')}")
            evidence = finding.get("evidence")
            if not isinstance(evidence, str) or not evidence.strip():
                raise AssertionError(f"empty evidence in {role}")
            source_path = _resolve_evidence_path(finding.get("affectedPath", ""))
            source = source_path.read_text(encoding="utf-8")
            if evidence.strip() not in source:
                raise AssertionError(
                    f"non-literal evidence for {role}/{finding.get('targetSymbol')}: {evidence!r}"
                )
            all_findings.append(finding)

    debugger_findings = [f for f in all_findings if f["subagentRole"] == "debugger"]
    debugger_evidence = "\n".join(f["evidence"] for f in debugger_findings)
    required_fragments = {
        "BUG-01 failure source": "return None",
        "BUG-01 propagation into the pipeline": "enriched.append(result)",
        "BUG-02 unmanaged input handle": "open(filepath",
        "BUG-03 unmanaged output handle": "open(output_path",
    }
    for label, fragment in required_fragments.items():
        if fragment not in debugger_evidence:
            raise AssertionError(f"debugger did not capture literal evidence for {label}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--report",
        type=Path,
        help="optional finalize_run JSON to validate against the fixture",
    )
    args = parser.parse_args()

    suite = unittest.defaultTestLoader.loadTestsFromTestCase(DemoFixtureTests)
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    if not result.wasSuccessful():
        return 1

    if args.report:
        try:
            validate_swarm_report(args.report.resolve())
        except (AssertionError, json.JSONDecodeError, OSError) as error:
            print(f"FAIL: swarm report validation: {error}", file=sys.stderr)
            return 1
        print(f"PASS: swarm report is source-backed and covers the demo targets: {args.report}")
    else:
        print("PASS: demo fixture and expected targets are intact.")
        print("Tip: add --report <finalize_run.json> to validate a real swarm result.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
