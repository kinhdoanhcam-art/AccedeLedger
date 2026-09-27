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

This confirms deployment identity and read integration. It does not replace a real Project write/post-state smoke test.

## Short live smoke path — pending hosted frontend

Use any author wallet and a different wallet as the named counterparty.

1. Open the hosted AccedeLedger site and confirm the Project address ends in `C92C35`.
2. Connect the author wallet. In **Open**, enter the counterparty wallet, label `the Supplier`, and text `We will receive weekly status reports from the Supplier every Friday.`
3. Submit once. Wait until the interface shows verified accepted state; save the generated undertaking ID.
4. Confirm the loaded record is `BINDS_OUTSIDE` and `AWAITING_ACCESSION`.
5. Switch to the named counterparty wallet and press **Accede**. Confirm the refreshed state is `EFFECTIVE` and `acceded_by` matches that wallet.
6. Switch back to the author, record `First weekly report received.`, and confirm `performance_count=1` with the note in the performance ledger.

Capture screenshots only for step 3 transaction result, step 5 final accession state, and step 6 performance post-state—or any error.

## Expected evidence boundary

Do not call the Project runtime complete until the write transaction shows execution success and the accepted read displays the expected semantic result and post-state. A submitted, accepted, or finalized lifecycle label alone is insufficient.
