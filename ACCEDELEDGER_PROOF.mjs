// Offline reproduction of the stale-record verification bug. No wallet or
// network connection is required.
//
// Run from the repository root after installing dependencies:
//     cd AccedeLedger-main && npm install && node ACCEDELEDGER_PROOF.mjs
//
// The legacy predicate accepts the stale record; the fixed predicate rejects it.

let keccak256, stringToBytes;
try {
  ({ keccak256, stringToBytes } = await import("viem"));
} catch {
  console.error("viem was not found. Run this file from the AccedeLedger repository root after npm install.");
  process.exit(2);
}

// Exact contract/AccedeLedger.py::_undertaking_id_for payload.
const undertakingId = (creator, text) => {
  const n = text.trim().split(/\s+/u).join(" ");
  return keccak256(stringToBytes(
    `OUTSIDE_DUTY_BIND:UNDERTAKING:V1|${creator.toLowerCase()}|${[...n].length}|${n}`)).slice(2);
};

const author = "0x3065E31B1D993d7C0D59E6786844cBa56780B2d3";
const text   = "We will not ship without the Supplier's written approval.";
const A = "0x1111111111111111111111111111111111111111";
const B = "0x2222222222222222222222222222222222222222";

const idA = undertakingId(author, text);
const idB = undertakingId(author, text);     // The counterparty is not part of the id payload.
console.log("id with counterparty A :", idA);
console.log("id with counterparty B :", idB);
console.log("same id                :", idA === idB,
            "-> second open_undertaking REVERTS 'Undertaking already exists'");

// The first record remains on-chain after the second transaction rolls back.
const stale = {
  undertaking_id: idA,
  creator: author,
  counterparty_wallet: A,
  counterparty_label: "Supplier A",
  text,
  outcome_code: 2,
  outcome: "BINDS_OUTSIDE",
  state: "AWAITING_ACCESSION",
  contested: false,
  acceded_by: "",
  performance_count: 0,
};

// Legacy open_undertaking success predicate.
const acceptedNow = (next) => next.undertaking_id === idB;
console.log("\ncurrent UI predicate on the STALE record :", acceptedNow(stale));
console.log("=> UI prints 'Accepted state changed as expected. The write is verified.'");
console.log("=> and shows counterparty", A, "while the user submitted", B);

// Complete fresh-record predicate used by the fixed interface.
const submitted = { wallet: B, label: "Supplier B", text };
const acceptedFixed = (next) =>
  next.undertaking_id === idB &&
  next.creator.toLowerCase() === author.toLowerCase() &&
  next.counterparty_wallet.toLowerCase() === submitted.wallet.toLowerCase() &&
  next.counterparty_label === submitted.label &&
  next.text === submitted.text.trim() &&
  (next.outcome === "AUTHOR_ONLY" || next.outcome === "BINDS_OUTSIDE") &&
  next.outcome_code === (next.outcome === "AUTHOR_ONLY" ? 1 : 2) &&
  next.state === (next.outcome === "AUTHOR_ONLY" ? "EFFECTIVE" : "AWAITING_ACCESSION") &&
  next.contested === false && next.acceded_by === "" && next.performance_count === 0;

console.log("\nfixed predicate on the STALE record     :",
  acceptedFixed(stale) === true ? "true (BAD)" : "false (correct -> reported as failure)");

const bugReproduced = acceptedNow(stale) === true && acceptedFixed(stale) === false;
console.log("\n" + (bugReproduced
  ? "REPRODUCED: the legacy predicate accepts the stale record; the fixed predicate rejects it."
  : "NOT REPRODUCED: inspect the fixture or predicate definitions."));
process.exit(bugReproduced ? 0 : 1);
