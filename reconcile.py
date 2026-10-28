#!/usr/bin/env python3
"""Payment reconciliation.

Reads payments.jsonl and works out how much money we actually collected.
Run:  python3 reconcile.py
"""
import json


def parse_amount(value):
    """Amounts may be a number or a string with thousands separators."""
    if isinstance(value, (int, float)):
        return float(value)
    return float(str(value).replace(",", "").strip())


def main():
    latest = {}

    with open("payments.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                event = json.loads(line)
            except Exception:
                # Ignore lines that can't be read.
                continue
            if not isinstance(event, dict) or not event.get("txn_id"):
                # Ignore events without a txn_id.
                continue

            txn_id = event["txn_id"]
            ts = event.get("ts", "")
            # Only the latest attempt for each txn_id counts.
            if txn_id not in latest or ts >= latest[txn_id].get("ts", ""):
                latest[txn_id] = event

    successful = [e for e in latest.values() if e.get("status") == "success"]
    count = len(successful)
    total = sum(parse_amount(e.get("amount", 0)) for e in successful)

    with open("expected.txt", "r", encoding="utf-8") as f:
        expected = int(f.read().strip())

    if count != expected:
        print(f"Check failed: counted {count} successful payments, expected {expected}.")
        print("Something in the data isn't being handled the way the README describes.")
    else:
        print(f"Check passed: {count} successful payments.")
        print(f"Your code: KOYA-{round(total)}")


if __name__ == "__main__":
    main()