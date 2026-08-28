#!/usr/bin/env bash
# ============================================================
# BobSwarm Demo Script
# Owner: Mmpoiemang (Data / QA Engineer)
#
# Runs the full BobSwarm demo against the sample broken project.
# Validates that the swarm output matches the expected findings.
# ============================================================

set -euo pipefail

DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$DEMO_DIR/sample-project"
EXPECTED="$DEMO_DIR/expected_output.md"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║            🐝 BobSwarm Demo                          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ── Step 1: Verify sample project is intact ──────────────────
echo "▶ Step 1: Verifying sample project..."
required_files=("app.py" "utils.py" "data/input.json")
for f in "${required_files[@]}"; do
  if [[ ! -f "$PROJECT_DIR/$f" ]]; then
    echo "  ✗ Missing: $PROJECT_DIR/$f"
    exit 1
  fi
done
echo "  ✓ Sample project files present"

# ── Step 2: Confirm Python is available ──────────────────────
echo "▶ Step 2: Checking Python..."
if ! command -v python3 &>/dev/null; then
  echo "  ✗ python3 not found — install Python 3.10+ and retry"
  exit 1
fi
PY_VERSION=$(python3 --version)
echo "  ✓ $PY_VERSION"

# ── Step 3: Run the broken pipeline to show it fails ─────────
echo ""
echo "▶ Step 3: Running sample project WITHOUT swarm (expect failures)..."
echo "  [This demonstrates the problem BobSwarm solves]"
echo ""
set +e
python3 "$PROJECT_DIR/app.py" \
  "$PROJECT_DIR/data/input.json" \
  "/tmp/bobswarm_demo_output.json" \
  "http://localhost:9999" 2>&1 | head -20
PIPELINE_EXIT=$?
set -e
if [[ $PIPELINE_EXIT -ne 0 ]]; then
  echo "  ✓ Pipeline failed as expected (ZeroDivisionError / TypeError from known bugs)"
else
  echo "  ⚠ Pipeline unexpectedly succeeded — sample project may have been modified"
fi

# ── Step 4: Prompt for BobSwarm orchestration ────────────────
echo ""
echo "═══════════════════════════════════════════════════════"
echo "▶ Step 4: Run BobSwarm orchestration"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "  In Bob, switch to 'BobSwarm Orchestrator' mode and paste:"
echo ""
echo "  ┌─────────────────────────────────────────────────────┐"
echo "  │  Analyse the codebase at demo/sample-project.       │"
echo "  │  Find all bugs, document the public API,            │"
echo "  │  suggest refactoring improvements, trace the        │"
echo "  │  data flow, and create an onboarding guide.         │"
echo "  └─────────────────────────────────────────────────────┘"
echo ""
echo "  BobSwarm will dispatch 5 subagents in parallel."
echo "  Expected findings are documented in: expected_output.md"
echo ""

# ── Step 5: Show expected output for validation ──────────────
echo "▶ Step 5: Expected swarm output (for demo validation):"
echo ""
cat "$EXPECTED"
echo ""
echo "  ✓ Demo script complete"
