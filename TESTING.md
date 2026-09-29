# AccedeLedger testing

## Automated checks

Run:

```bash
npm ci
npm run check
```

The check command verifies:

- exact frozen contract SHA-256;
- required contract method surface and internal identity;
- Project-address isolation from the IC submission address;
- absence of unrelated generated traces in public files;
- frontend undertaking-ID derivation against two known contract vectors;
- Python/JavaScript ID parity across 12 whitespace and Unicode cases;
- receipt-first write decisions and the complete fresh-record predicate across R0–R7;
- TypeScript and production Vite build.

The final local results on 2026-09-29 were:

- `node ACCEDELEDGER_PROOF.mjs`: rc 0; the legacy predicate accepted the stale record and the complete predicate rejected it.
- `npm run typecheck`: rc 0.
- `npm test`: rc 0; R0–R7 passed with 18 negative field/transition checks.
- `npm run build`: rc 0.

### Regression sensitivity

The verifier was temporarily restored to its previous state-first behavior together with the previous ID-only `open_undertaking` predicate. The unchanged test suite then failed seven groups: R1, R2, R3, R4, R5, R6, and R7. Restoring the patch produced zero failing groups. This establishes that the new suite detects the reporting bug rather than merely passing on the new implementation.

## Confirmed on the fresh Project deployment

- Address: `0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35`
- Network: StudioNet `61999`
- Deploy result shown in Explorer: GenVM `SUCCESS`, consensus `Accepted`
- `get_limits`: contract `OutsideDutyBind`, version `1.3`
- Hosted app: <https://accede-ledger.vercel.app/>
- Hosted header confirms StudioNet `61999` and Project address ending in `C92C35`

## Completed Project runtime proof

- Undertaking ID: `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6`
- Author: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`
- Named counterparty: `0x5a52d040581A76e2C032542855D31480f2ea7097`
- Counterparty label: `the Supplier`
- Undertaking text: `We will receive weekly status reports from the Supplier every Friday.`
- Semantic outcome after opening: `BINDS_OUTSIDE`
- Initial state: `AWAITING_ACCESSION`
- State after the named wallet acceded: `EFFECTIVE`
- `acceded_by`: `0x5a52d040581A76e2C032542855D31480f2ea7097`
- Recorded performance: `First weekly report received.`
- Verified post-state: `performance_count=1`
- `record_performance` transaction: <https://explorer-studio.genlayer.com/tx/0x9b10ec6a9395fc2fee910818b6d01e77abc076f0528bec7e384369a8cfa468c4>
- Explorer result: consensus `Accepted`, GenVM `SUCCESS`, result code `Return`, lifecycle `Finalized`
The Explorer execution result and the separately refreshed accepted-state read establish both execution success and the intended postconditions.

## Completed hosted interface-patch proof

The patched hosted interface was exercised with wallet-signed StudioNet transactions on 2026-09-29. The exact fresh text was:

`The Supplier shall deliver the signed inspection report for batch AL-20260929-A before final acceptance.`

It produced undertaking ID `5eebfa18f2c8376119d203b58b2d247c45e6b5dec69f491ba99f66f8248ceb14` for author `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`.

| # | Wallet | Action | Verified result | Evidence |
|---|---|---|---|---|
| 1 | author | Open for cpA `0x5a52…7097`, label `Supplier A`, and fresh text T | Receipt success; `BINDS_OUTSIDE`; state `AWAITING_ACCESSION`; complete submitted record matched | [Open transaction](https://explorer-studio.genlayer.com/tx/0xa5d03189eee93e36a03d26412cd235d6adacf7efdd8ca6eaa5a9e4232c5bdd85) |
| 2 | author | Attempt the same text T for cpB while the normal preflight is active | Submission blocked; UI explains that author + text determine the ID | Hosted UI capture; no transaction by design |
| 3 | author | In temporary evidence mode, submit the same text T for cpB `0xADE4…aD1D`, label `Supplier B` | GenVM `ERROR`; `Rollback`; reason `Undertaking already exists`; UI retains the accepted cpA / `Supplier A` record | [Rollback transaction](https://explorer-studio.genlayer.com/tx/0x0d75300ca34035ead49b084a8836b84151cc6e12bf8811f5f79021e4bd53211e) |
| 4 | cpA | Accede to the undertaking from step 1 | GenVM `SUCCESS`; accepted state `EFFECTIVE`; `acceded_by=0x5a52…7097` | [Accede transaction](https://explorer-studio.genlayer.com/tx/0x6ef8d021f275bce68bccd9e7909db3195cfe10169a241af64d058a781d01568a) plus refreshed accepted-state read |

This was a four-checkpoint run but only three transaction submissions: checkpoint 2 was blocked before a transaction existed. The duplicate transaction proves that the interface distinguishes a contract rollback from wallet rejection or RPC failure and does not let the stale accepted record prove success.

## Evidence boundary

- The new run proves the hosted duplicate-reporting path and the accession post-state.
- It does not add a performance record or contest to the new undertaking.
- The older completed record above separately proves the performance path with `performance_count=1`.
- The temporary evidence switch must be returned to `VITE_ALLOW_DUPLICATE_SEND=0` for the normal public deployment.

## Read-only reviewer path

1. Open <https://accede-ledger.vercel.app/> and confirm StudioNet `61999` and the Project address ending in `C92C35`.
2. Paste `5eebfa18f2c8376119d203b58b2d247c45e6b5dec69f491ba99f66f8248ceb14` into **Undertaking ID** and press **Load**. No wallet is required.
3. Confirm label `Supplier A`, `BINDS_OUTSIDE`, `EFFECTIVE`, author `0x3065…B2d3`, and counterparty / `acceded_by` `0x5a52…a7097`.
4. Open the duplicate rollback link and verify `open_undertaking`, cpB / `Supplier B`, GenVM `ERROR`, result code `Rollback`, and `Undertaking already exists`.
5. Open the Accede link and verify method `accede`, consensus `Accepted`, GenVM `SUCCESS`, and result code `Return`.
6. Optionally load the older undertaking `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6` to inspect the separately proven performance record.
