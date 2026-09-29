# AccedeLedger — Project submission draft

## One-line

A live GenLayer ledger that shows when an undertaking reaches a named outside wallet and enforces accession before performance can be recorded.

## Description

AccedeLedger turns one narrow semantic decision into an inspectable workflow. GenLayer validators classify whether an undertaking burdens only its author or also requires action from a named counterparty. Author-only text becomes effective immediately; outside-binding text remains inert until the exact named wallet accedes. The interface reads accepted state without requiring a wallet and displays the author, counterparty, semantic outcome, state, accession, performance history, and contest status. A write is reported as successful only after the exact transaction receipt succeeds and the expected accepted post-state matches. Authorization, identifiers, counters, decline, performance, and irreversible contest rules remain deterministic in the frozen contract.

## Changes & Improvements (967 characters)

open_undertaking success is now gated first on the submitted transaction's authoritative leader receipt, then on a complete field-by-field match of the new record: author, counterparty, label, text, outcome/code/state consistency, contested=false, acceded_by="", and performance_count=0. An ERROR receipt stops immediately and reports the contract reason; a pending receipt remains submitted; a successful receipt with mismatched state is reported as failure. Existing records can no longer prove a new write. A preflight check blocks the same author/text duplicate and explains that changing the counterparty does not change the ID. The same receipt gate covers accede, decline, contest, and performance writes. tests/verify-outcome.mjs covers R0-R7 and fails 7 groups when the legacy state-first/id-only logic is restored, then passes with the patch. Python/JS ID parity now covers 12 whitespace/Unicode cases. No contract change; address and SHA-256 are unchanged.

## Links

- Website: <https://accede-ledger.vercel.app/>
- GitHub: <https://github.com/kinhdoanhcam-art/AccedeLedger>
- Project contract: <https://explorer-studio.genlayer.com/address/0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35>
- Runtime proof: <https://explorer-studio.genlayer.com/tx/0x9b10ec6a9395fc2fee910818b6d01e77abc076f0528bec7e384369a8cfa468c4>
- Receipt-gate implementation: <https://github.com/kinhdoanhcam-art/AccedeLedger/blob/main/src/lib/verify.ts>
- Duplicate regression suite: <https://github.com/kinhdoanhcam-art/AccedeLedger/blob/main/tests/verify-outcome.mjs>

## Expected verification

Load undertaking `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6`. The accepted state shows `BINDS_OUTSIDE`, `EFFECTIVE`, the named wallet in `acceded_by`, and one performance record. Explorer shows the final `record_performance` call as `Accepted`, GenVM `SUCCESS`, and `Finalized`.

## Suggested tags

Developer Tools / Contract Monitoring / Contract Testing
