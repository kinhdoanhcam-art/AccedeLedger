# AccedeLedger

AccedeLedger is the Project interface for the frozen `OutsideDutyBind` GenLayer Intelligent Contract. It lets anyone inspect accepted undertaking state without a wallet, while authors and named counterparties can perform the exact state transitions authorized by the contract.

## Project deployment

- Network: StudioNet
- Chain ID: `61999`
- Project contract: `0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35`
- Explorer: <https://explorer-studio.genlayer.com/address/0x043F8e52461165BEfe5b8fE66F1de8F4F0C92C35>
- Internal contract name/version: `OutsideDutyBind` / `1.3`
- Frozen contract source: `contract/AccedeLedger.py`
- Raw source SHA-256: `6a0442d9156d99dbf7471ba5aa08f1428b7b3746d25f57df6c2a2beeb212ab28`

This address is separate from the Intelligent Contract submission address. The filename is Project-branded, but the source bytes, class, semantic rubric, and internal identity are unchanged.

## What the interface does

- Reads `get_limits`, `get_undertaking`, `get_performances`, and `get_contest_note` from accepted state.
- Opens a new undertaking through GenLayer consensus.
- Derives the exact deterministic undertaking ID before submission.
- Exposes accession and decline only for the named counterparty flow.
- Lets the author record performance only when the undertaking is effective and uncontested.
- Lets the named counterparty contest once after effectiveness.
- Shows transaction submission separately from verified accepted-state success.
- Links the contract and submitted transactions to Studio Explorer.

No live-looking record is seeded or fabricated. Empty state remains empty until a real ID is loaded or a wallet submits a real transaction.

## Run locally

```bash
npm ci
npm run check
npm run dev
```

For Vercel, keep the default Project address or set `VITE_CONTRACT_ADDRESS` to the same address. The included `/api/rpc` function proxies StudioNet reads without storing credentials.

## Runtime status

The fresh deployment and `get_limits` identity read are confirmed. Project write-path smoke proof remains pending until the hosted frontend is tested with wallets; see `TESTING.md` for the short path.
