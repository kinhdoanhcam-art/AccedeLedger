import assert from "node:assert/strict";
import { undertakingId } from "../src/lib/id.ts";
import {
  decideWrite,
  expectedNewUndertaking,
  txOutcomeFromTransaction,
} from "../src/lib/verify.ts";

const author = "0x3065E31B1D993d7C0D59E6786844cBa56780B2d3";
const counterpartyA = "0x1111111111111111111111111111111111111111";
const counterpartyB = "0x2222222222222222222222222222222222222222";
const text = "We will not ship without the Supplier's written approval.";
const idA = undertakingId(author, text);
const idB = undertakingId(author, text);
const hash = `0x${"ab".repeat(32)}`;

const staleRecord = {
  undertaking_id: idA,
  creator: author,
  counterparty_wallet: counterpartyA,
  counterparty_label: "Supplier A",
  text,
  outcome_code: 2,
  outcome: "BINDS_OUTSIDE",
  state: "AWAITING_ACCESSION",
  contested: false,
  acceded_by: "",
  performance_count: 0,
};

const expectedRecord = {
  ...staleRecord,
  counterparty_wallet: counterpartyB,
  counterparty_label: "Supplier B",
};

const accepted = expectedNewUndertaking({
  id: idB,
  account: author,
  wallet: counterpartyB,
  label: "Supplier B",
  text,
});

const instantSleep = async () => undefined;

async function decision(outcome, record, predicate = accepted, onRead = () => undefined) {
  return decideWrite({
    hash,
    readOutcome: async () => outcome,
    readRecord: async () => {
      onRead();
      return record;
    },
    accepted: predicate,
    outcomeWaits: [0],
    stateWaits: [0],
    sleep: instantSleep,
  });
}

const failures = [];
async function test(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

await test("R0 authoritative receipt parsing", async () => {
  assert.deepEqual(txOutcomeFromTransaction({}), { status: "pending" });
  assert.deepEqual(
    txOutcomeFromTransaction({
      consensus_data: { leader_receipt: [{ mode: "LEADER", execution_result: "SUCCESS" }] },
    }),
    { status: "success" }
  );
  assert.deepEqual(
    txOutcomeFromTransaction({
      consensusData: { leaderReceipt: { executionResult: "ERROR", message: "Undertaking already exists" } },
    }),
    { status: "error", reason: "Undertaking already exists" }
  );
  assert.deepEqual(
    txOutcomeFromTransaction({
      consensus_data: {
        leader_receipt: [{
          mode: "LEADER",
          execution_result: "ERROR",
          result: { status: "rollback", payload: "Undertaking already exists" },
        }],
      },
    }),
    { status: "error", reason: "Undertaking already exists" },
    "current genlayer-js decoded rollback shape"
  );
});

await test("R1 duplicate rollback rejects the stale different-counterparty record", async () => {
  assert.equal(idA, idB, "counterparty is intentionally absent from the contract id");
  assert.equal(staleRecord.undertaking_id === idB, true, "legacy id-only predicate reproduces the bug");
  let stateReads = 0;
  const result = await decision(
    { status: "error", reason: "Undertaking already exists" },
    staleRecord,
    accepted,
    () => { stateReads += 1; }
  );
  assert.equal(result.kind, "error");
  assert.match(result.message, /Undertaking already exists/);
  assert.equal(stateReads, 0, "an ERROR receipt must not read state to rescue the write");
});

await test("R2 SUCCESS receipt cannot rescue a stale different-counterparty record", async () => {
  const result = await decision({ status: "success" }, staleRecord);
  assert.equal(result.kind, "error");
  assert.match(result.message, /does not match what was submitted/);
});

await test("R3 SUCCESS receipt plus a complete fresh record is verified", async () => {
  const result = await decision({ status: "success" }, expectedRecord);
  assert.equal(result.kind, "success");
  assert.equal(result.message, "Transaction succeeded and the new record matches what was submitted.");
});

await test("R4 pending receipt never promotes an existing record to success", async () => {
  let stateReads = 0;
  const result = await decision(
    { status: "pending" },
    staleRecord,
    accepted,
    () => { stateReads += 1; }
  );
  assert.equal(result.kind, "submitted");
  assert.equal(stateReads, 0);
});

await test("R5 SUCCESS receipt with a wrong label is rejected", async () => {
  const result = await decision(
    { status: "success" },
    { ...expectedRecord, counterparty_label: "Wrong label" }
  );
  assert.equal(result.kind, "error");
});

await test("R6 every expected-new-record field is load-bearing", async () => {
  const mismatches = [
    ["undertaking_id", { undertaking_id: "0".repeat(64) }],
    ["creator", { creator: counterpartyA }],
    ["counterparty_wallet", { counterparty_wallet: counterpartyA }],
    ["counterparty_label", { counterparty_label: "Supplier A" }],
    ["text", { text: `${text} changed` }],
    ["outcome", { outcome: "UNKNOWN" }],
    ["outcome_code consistency", { outcome_code: 1 }],
    ["state consistency", { state: "EFFECTIVE" }],
    ["contested", { contested: true }],
    ["acceded_by", { acceded_by: counterpartyB }],
    ["performance_count", { performance_count: 1 }],
  ];

  for (const [name, change] of mismatches) {
    const result = await decision({ status: "success" }, { ...expectedRecord, ...change });
    assert.equal(result.kind, "error", `${name} mismatch`);
  }
});

await test("R7 ERROR receipt defeats already-target-state accede/decline/contest predicates", async () => {
  const targetStates = [
    ["accede", { ...staleRecord, state: "EFFECTIVE", acceded_by: counterpartyA },
      (next) => next.state === "EFFECTIVE" && next.acceded_by.toLowerCase() === counterpartyA.toLowerCase()],
    ["decline", { ...staleRecord, state: "DECLINED", acceded_by: "" },
      (next) => next.state === "DECLINED" && next.acceded_by === ""],
    ["contest", { ...staleRecord, state: "EFFECTIVE", contested: true },
      (next) => next.contested === true],
  ];

  for (const [name, record, predicate] of targetStates) {
    const result = await decision(
      { status: "error", reason: `${name} already completed` },
      record,
      predicate
    );
    assert.equal(result.kind, "error", name);
    assert.match(result.message, /already completed/, name);
  }
});

if (failures.length) {
  console.error(`FAILED ${failures.length} regression group(s): ${failures.join(", ")}`);
  process.exit(1);
}

console.log("PASS receipt-first write verification (R0-R7; 18 negative field/transition checks)");
