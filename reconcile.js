// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

function parseAmount(value) {
  // Amounts may be a number or a string with thousands separators.
  if (typeof value === "number") return value;
  return parseFloat(String(value).replace(/,/g, "").trim());
}

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);
const latest = new Map();

for (const line of lines) {
  let event;
  try {
    event = JSON.parse(line);
  } catch (e) {
    // Ignore lines that can't be read.
    continue;
  }
  if (!event || typeof event !== "object" || !event.txn_id) {
    // Ignore events without a txn_id.
    continue;
  }

  const txn_id = event.txn_id;
  const ts = event.ts || "";
  // Only the latest attempt for each txn_id counts.
  if (!latest.has(txn_id) || ts >= latest.get(txn_id).ts) {
    latest.set(txn_id, event);
  }
}

let total = 0;
let count = 0;
for (const event of latest.values()) {
  if (event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}