#!/usr/bin/env bash
# BobSwarm demo launcher for macOS/Linux/Git Bash.
# The cross-platform validation itself lives in validate_demo.py.

set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "Python 3.10+ is required." >&2
  exit 1
fi

echo "BobSwarm demo preflight"
echo "======================="
"$PYTHON_BIN" "$DEMO_DIR/validate_demo.py"

echo ""
echo "Preflight passed. Complete the explicit Bob handoff:"
echo ""
echo "1. Submit this task in the BobSwarm dashboard:"
echo "   Analyse demo/sample-project: find bugs, document the public API,"
echo "   suggest targeted refactoring, trace data lineage, and create onboarding."
echo ""
echo "2. Copy the exact run UUID displayed by the dashboard."
echo ""
echo "3. In Bob, select 'BobSwarm Orchestrator' and paste:"
echo "   runId: <RUN_ID_FROM_DASHBOARD>"
echo "   Task: Analyse demo/sample-project. Find all bugs, document the public API,"
echo "   suggest targeted refactoring, trace the data flow, and create an onboarding guide."
echo ""
echo "The dashboard creates and visualises the run; Bob performs the dispatch."
echo "Expected source-backed targets: $DEMO_DIR/expected_output.md"
echo ""
echo "Optional final verification:"
echo "  $PYTHON_BIN $DEMO_DIR/validate_demo.py --report <finalize_run.json>"
