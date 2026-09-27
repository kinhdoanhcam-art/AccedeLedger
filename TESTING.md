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
- TypeScript and production Vite build.

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
- Hosted result: `Accepted state changed as expected. The write is verified.`

The Explorer execution result and the separately refreshed accepted-state read establish both execution success and the intended postconditions.

## Read-only reviewer path

1. Open <https://accede-ledger.vercel.app/> and confirm StudioNet `61999` and the Project address ending in `C92C35`.
2. Paste `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6` into **Undertaking ID** and press **Load**. No wallet is required.
3. Confirm `BINDS_OUTSIDE`, `EFFECTIVE`, author `0x3065…B2d3`, counterparty and `acceded_by` `0x5a52…a7097`.
4. Confirm `PERFORMANCE RECORDS` is `1` and the ledger contains `First weekly report received.`
5. Open the transaction link above and verify method `record_performance`, consensus `Accepted`, GenVM `SUCCESS`, and lifecycle `Finalized`.
