# AccedeLedger — Project submission draft

## One-line

A live GenLayer ledger that shows when an undertaking reaches a named outside wallet and enforces accession before performance can be recorded.

## Description

AccedeLedger turns one narrow semantic decision into an inspectable workflow. GenLayer validators classify whether an undertaking burdens only its author or also requires action from a named counterparty. Author-only text becomes effective immediately; outside-binding text remains inert until the exact named wallet accedes. The interface reads accepted state without requiring a wallet, displays the author, counterparty, semantic outcome, state, accession, performance history, and contest status, and verifies post-state before reporting write success. Authorization, identifiers, counters, decline, performance, and irreversible contest rules remain deterministic in the frozen contract.

## Links

- Website: <https://accede-ledger.vercel.app/>
- GitHub: `PENDING_GITHUB_URL`
- Project contract: <https://explorer-studio.genlayer.com/address/0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35>
- Runtime proof: <https://explorer-studio.genlayer.com/tx/0x9b10ec6a9395fc2fee910818b6d01e77abc076f0528bec7e384369a8cfa468c4>

## Expected verification

Load undertaking `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6`. The accepted state shows `BINDS_OUTSIDE`, `EFFECTIVE`, the named wallet in `acceded_by`, and one performance record. Explorer shows the final `record_performance` call as `Accepted`, GenVM `SUCCESS`, and `Finalized`.

## Suggested tags

Developer Tools / Contract Monitoring / Contract Testing
