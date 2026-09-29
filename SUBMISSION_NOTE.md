# AccedeLedger — Project resubmission

## One-line

A live GenLayer ledger that shows when an undertaking reaches a named outside wallet and enforces accession before performance can be recorded.

## Description

AccedeLedger turns one narrow semantic decision into an inspectable workflow. GenLayer validators classify whether an undertaking burdens only its author or also requires action from a named counterparty. Author-only text becomes effective immediately; outside-binding text remains inert until the exact named wallet accedes. The interface reads accepted state without requiring a wallet and displays the author, counterparty, semantic outcome, state, accession, performance history, and contest status. A write is reported as successful only after the exact transaction receipt succeeds and the expected accepted post-state matches. Authorization, identifiers, counters, decline, performance, and irreversible contest rules remain deterministic in the frozen contract.

## Changes & Improvements

open_undertaking success is now gated first on the exact transaction's authoritative leader receipt, then on a complete field-by-field fresh-record match. The receipt decoder handles the current genlayer-js rollback shape, so the hosted UI displays the contract reason `Undertaking already exists` instead of a generic rollback. Existing records cannot rescue a failed duplicate, and evidence mode keeps the accepted cpA record visible while proving the cpB attempt rolled back. Default preflight blocks the same author/text duplicate and explains that counterparty is not part of the ID. The receipt gate also covers accede, decline, contest, and performance. R0-R7 and 18 negative checks pass, including the decoded rollback regression. Python/JS ID parity covers 12 Unicode/whitespace cases. No contract change, redeployment, or address change.

## Links

- Website: <https://accede-ledger.vercel.app/>
- GitHub: <https://github.com/kinhdoanhcam-art/AccedeLedger>
- Project contract: <https://explorer-studio.genlayer.com/address/0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35>
- Successful open: <https://explorer-studio.genlayer.com/tx/0xa5d03189eee93e36a03d26412cd235d6adacf7efdd8ca6eaa5a9e4232c5bdd85>
- Duplicate rollback: <https://explorer-studio.genlayer.com/tx/0x0d75300ca34035ead49b084a8836b84151cc6e12bf8811f5f79021e4bd53211e>
- Successful accession: <https://explorer-studio.genlayer.com/tx/0x6ef8d021f275bce68bccd9e7909db3195cfe10169a241af64d058a781d01568a>
- Receipt-gate implementation: <https://github.com/kinhdoanhcam-art/AccedeLedger/blob/main/src/lib/verify.ts>
- Duplicate regression suite: <https://github.com/kinhdoanhcam-art/AccedeLedger/blob/main/tests/verify-outcome.mjs>

## Expected verification

Load undertaking `5eebfa18f2c8376119d203b58b2d247c45e6b5dec69f491ba99f66f8248ceb14`. Accepted state shows `Supplier A`, `BINDS_OUTSIDE`, `EFFECTIVE`, and `0x5a52…7097` as both counterparty and `acceded_by`. The duplicate Explorer transaction shows cpB / `Supplier B`, GenVM `ERROR`, `Rollback`, and `Undertaking already exists`; the Accede transaction shows GenVM `SUCCESS` and result code `Return`.

## Suggested tags

Developer Tools / Contract Monitoring / Contract Testing
