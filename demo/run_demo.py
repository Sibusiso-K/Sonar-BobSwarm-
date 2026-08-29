import subprocess
import sys
import tempfile
from pathlib import Path

# Windows' default console codepage (cp1252 or similar) can't encode the
# box-drawing characters and emoji this script prints, crashing with
# UnicodeEncodeError before step 1 even runs. Reconfigure stdout/stderr to
# UTF-8 explicitly rather than stripping the characters -- available on
# Python 3.7+, and this script already requires 3.10+.
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

DEMO_DIR = Path(__file__).parent.resolve()
PROJECT_DIR = DEMO_DIR / "sample-project"
EXPECTED = DEMO_DIR / "expected_output.md"

print("\n╔══════════════════════════════════════════════════════╗")
print("║            🐝 BobSwarm Demo                          ║")
print("╚══════════════════════════════════════════════════════╝\n")

# Step 1: Verify files
print("▶ Step 1: Verifying sample project...")
required_files = ["app.py", "utils.py", "data/input.json"]
for f in required_files:
    if not (PROJECT_DIR / f).exists():
        print(f"  ✗ Missing: {PROJECT_DIR / f}")
        sys.exit(1)
print("  ✓ Sample project files present")

# Step 2: Check Python
print(f"▶ Step 2: Checking Python...\n  ✓ Python {sys.version.split()[0]}")

# Step 3: Run broken pipeline
print("\n▶ Step 3: Running sample project WITHOUT swarm (expect failures)...")
with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tmp:
    tmp_out = tmp.name

cmd = [
    sys.executable,
    str(PROJECT_DIR / "app.py"),
    str(PROJECT_DIR / "data/input.json"),
    tmp_out,
    "http://localhost:9999"
]
result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode != 0:
    print("  ✓ Pipeline failed as expected (Unhandled NoneType / AttributeError)")
else:
    print("  ⚠ Pipeline unexpectedly succeeded")

# Step 4: Prompt for BobSwarm Orchestration
print("\n" + "═" * 55)
print("▶ Step 4: Run BobSwarm orchestration")
print("═" * 55 + "\n")
print("  In Bob, paste this prompt:\n")
print("  ┌─────────────────────────────────────────────────────┐")
print("  │  Analyse the codebase at demo/sample-project.       │")
print("  │  Find all bugs, document the public API,            │")
print("  │  suggest refactoring improvements, trace the        │")
print("  │  data flow, and create an onboarding guide.         │")
print("  └─────────────────────────────────────────────────────┘\n")

# Step 5: Show expected findings
print("▶ Step 5: Expected swarm output:")
if EXPECTED.exists():
    print(EXPECTED.read_text(encoding="utf-8"))
print("  ✓ Demo script complete")