import json
import random
import sys
from pathlib import Path
from typing import Any

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
    for _ in range(count):
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

    output_path = (
        Path(__file__).resolve().parent
        / "sample-project"
        / "data"
        / "synthetic_input.json"
    )
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(batch, f, indent=2)

    print(f"✓ Generated {len(batch)} synthetic records -> {output_path}")