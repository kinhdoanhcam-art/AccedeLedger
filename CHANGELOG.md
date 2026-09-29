# Changelog

## 2026-09-29 — receipt-bound write verification

### Problem

The interface previously inspected accepted state before checking the submitted transaction outcome. Because an undertaking ID is derived from the author and normalized text, a second `open_undertaking` with the same author/text but a different counterparty targets the existing ID. The old ID-only predicate could therefore accept that stale record and report a rolled-back duplicate as a verified write. The same state-first pattern could misreport repeated `accede`, `decline`, or `contest` calls when the record was already in the target state.

### Patch

- Every write now passes the authoritative receipt gate for its exact transaction hash before state is considered.
- Receipt `ERROR` returns failure immediately; accepted state is never allowed to rescue it.
- A receipt without an execution result remains `submitted`; it is not promoted to success and is not automatically resent.
- Receipt `SUCCESS` is followed by accepted-state verification; a mismatch is reported as failure.
- `open_undertaking` compares the complete expected fresh record: ID, creator, counterparty, label, stored text, outcome/code/state consistency, `contested=false`, empty `acceded_by`, and `performance_count=0`.
- A default-on preflight check prevents a known author/text duplicate from being submitted and explains why changing only the counterparty cannot change the ID.
- JavaScript text stripping and whitespace normalization now match Python, including U+001C–U+001F and U+0085 while intentionally preserving U+FEFF.
- The duplicate-send bypass requires both `VITE_ALLOW_DUPLICATE_SEND=1` and the `?duplicate-proof=1` query parameter; it defaults to `0` and exists solely to capture a real rollback receipt for verification.

### Executable regression proof

With the legacy state-first verifier and ID-only predicate temporarily restored, `npm test` failed seven regression groups: R1, R2, R3, R4, R5, R6, and R7. After restoring the patch, the same suite completed with zero failing groups. R0–R7 include 18 negative field/transition checks, and the separate parity suite compares 12 whitespace/Unicode cases with a Python reference.

### Deployment identity

No contract change; address and SHA-256 remain unchanged.

- Contract: `0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35`
- Contract SHA-256: `6a0442d9156d99dbf7471ba5aa08f1428b7b3746d25f57df6c2a2beeb212ab28`
- Contract redeployment required: **No**

### Hosted runtime validation

- Fresh open: `0xa5d03189eee93e36a03d26412cd235d6adacf7efdd8ca6eaa5a9e4232c5bdd85`
- Duplicate rollback: `0x0d75300ca34035ead49b084a8836b84151cc6e12bf8811f5f79021e4bd53211e`
- Accede: `0x6ef8d021f275bce68bccd9e7909db3195cfe10169a241af64d058a781d01568a`
- Verified accepted post-state: `EFFECTIVE`, with `0x5a52d040581A76e2C032542855D31480f2ea7097` in `acceded_by`.
