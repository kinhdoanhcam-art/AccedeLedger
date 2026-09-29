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

## Live verification required for this interface patch

The deterministic patch tests are complete. The following live run is intentionally marked **PENDING** until wallet-signed transactions and screenshots are supplied. Use a new undertaking text that has never been opened by the author on this contract.

| # | Wallet | Action | Expected result | Evidence status |
|---|---|---|---|---|
| 1 | author | Open for cpA with label `Supplier A` and fresh text T | Receipt success; UI says `Transaction succeeded and the new record matches what was submitted.` | Transaction hash + ID: **PENDING** |
| 2 | author | Attempt the same text T for cpB while `VITE_ALLOW_DUPLICATE_SEND=0` | Preflight blocks submission and explains that author + text determine the ID | Screenshot 1; no transaction by design: **PENDING** |
| 3 | author | On a temporary build with `VITE_ALLOW_DUPLICATE_SEND=1`, add `?duplicate-proof=1` to the URL and submit the same text T for cpB | Receipt rollback; UI says `Transaction rolled back: Undertaking already exists`; loaded record still shows cpA | Reverted transaction hash + screenshot 2: **PENDING** |
| 4 | cpA | Accede to the undertaking from step 1 | Receipt success; state `EFFECTIVE`; `acceded_by=cpA` | Transaction hash: **PENDING** |

This is a four-checkpoint run but only three transaction submissions: checkpoint 2 must be blocked before a transaction exists. A temporary evidence build may set `VITE_ALLOW_DUPLICATE_SEND=1`; use its normal URL for checkpoint 2 and the same URL with `?duplicate-proof=1` for checkpoint 3. Return the public deployment to `VITE_ALLOW_DUPLICATE_SEND=0` after capture.

## What this run does not prove

- Local tests do not prove that a new StudioNet transaction reached consensus or that the hosted deployment contains this patch.
- The older completed runtime record proves the frozen contract's main state transition, not the new duplicate-reporting interface path.
- Until the PENDING table above is completed, the rollback wording, transaction hash, and stale-record display remain unverified on the hosted frontend.

## Read-only reviewer path

1. Open <https://accede-ledger.vercel.app/> and confirm StudioNet `61999` and the Project address ending in `C92C35`.
2. Paste `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6` into **Undertaking ID** and press **Load**. No wallet is required.
3. Confirm `BINDS_OUTSIDE`, `EFFECTIVE`, author `0x3065…B2d3`, counterparty and `acceded_by` `0x5a52…a7097`.
4. Confirm `PERFORMANCE RECORDS` is `1` and the ledger contains `First weekly report received.`
5. Open the transaction link above and verify method `record_performance`, consensus `Accepted`, GenVM `SUCCESS`, and lifecycle `Finalized`.
