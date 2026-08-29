import json
import random
import sys
import requests
from typing import Any
from pathlib import Path

TYPE_CORRUPTIONS = [
    {"name": "Alex Vance", "email": "alex@test.com", "scores": ["85", "ninety", None]},
    {"name": "Chris Paul", "email": "chris@test.com", "scores": [100, "invalid_score"]},
]

SCHEMA_DRIFTS: list[dict[str, Any]] = [
    {"id": "syn-drift-1", "name": "Taylor Swift"},  # Missing email & scores
    {"id": "syn-drift-2", "email": "no-scores@test.com"},  # Missing name & scores
]

def generate_batch(count=3):
    batch = []
    for i in range(count):
        defect_type = random.choice(["type_corruption", "schema_drift"])
        if defect_type == "type_corruption":
            rec = random.choice(TYPE_CORRUPTIONS).copy()
            rec["id"] = f"syn-type-{random.randint(100, 999)}"
        else:
            rec = random.choice(SCHEMA_DRIFTS).copy()
        
        rec["_meta"] = {"synthetic": True, "defect_category": defect_type}
        batch.append(rec)
    return batch

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 3
    batch = generate_batch(count)
    
    output_path = Path(__file__).resolve().parent / "sample-project" / "data" / "synthetic_input.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(batch, f, indent=2)
    print(f"Generated {len(batch)} synthetic records -> {output_path.name}")

    # Mode B: On-Demand POST trigger (when server is running)
    if "--push" in sys.argv:
        try:
            res = requests.post("http://localhost:8787/runs", json={"records": batch})
            print(f" Pushed to API: HTTP {res.status_code}")
        except Exception as e:
            print(f" API trigger skipped (Server offline): {e}")