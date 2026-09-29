# AccedeLedger

AccedeLedger is the Project interface for the frozen `OutsideDutyBind` GenLayer Intelligent Contract. It lets anyone inspect accepted undertaking state without a wallet, while authors and named counterparties can perform the exact state transitions authorized by the contract.

## Project deployment

- Network: StudioNet
- Chain ID: `61999`
- Live app: <https://accede-ledger.vercel.app/>
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
- Checks the submitted transaction's leader receipt before accepted state can prove success.
- Matches every field of a newly opened record before reporting a verified write.
- Links the contract and submitted transactions to Studio Explorer.

No live-looking record is seeded or fabricated. Empty state remains empty until a real ID is loaded or a wallet submits a real transaction.

## One undertaking per author per text

The contract derives each undertaking ID from the author's wallet and normalized undertaking text. The counterparty is intentionally not part of that ID. The same author therefore cannot open the same text twice, even when the second submission names a different counterparty. To create a separate undertaking for another counterparty, the author must change the undertaking wording. This is frozen contract behavior, not a contract defect; the interface now detects it before submission and explains the rule instead of allowing a later rollback to look successful.

## How write success is reported

The interface verifies two independent facts in order:

1. The authoritative leader receipt for the exact submitted transaction must report success. An error receipt is final for the interface; an existing record cannot rescue it. A missing execution result remains pending.
2. Accepted state must then match the expected post-state. For `open_undertaking`, that means the complete fresh record, including the submitted counterparty, label, stored text, outcome/code/state consistency, and untouched fresh-record markers.

The optional `VITE_ALLOW_DUPLICATE_SEND=1` setting enables a controlled evidence path. Even in that temporary build, the normal URL keeps the preflight active; adding `?duplicate-proof=1` bypasses only that preflight so a real rollback transaction can be captured. The setting is `0` by default, which makes the query parameter inert, and it must not be enabled for the normal public deployment.

## Run locally

```bash
npm ci
npm run typecheck
npm test
npm run check
node ACCEDELEDGER_PROOF.mjs
npm run dev
```

The executable parity suite requires Node.js 22.18 or newer and Python 3.

For Vercel, keep the default Project address or set `VITE_CONTRACT_ADDRESS` to the same address. The included `/api/rpc` function proxies StudioNet reads without storing credentials.

## Runtime status

The fresh deployment, `get_limits` identity read, hosted integration, and the main Project write path are confirmed on StudioNet.

- Proven undertaking ID: `1d55c5df9cd29468073570b55d779a41943d982c4d91430effce94a9d47df8d6`
- Semantic outcome: `BINDS_OUTSIDE`
- Final state: `EFFECTIVE`
- Author: `0x3065E31B1D993d7C0D59E6786844cBa56780B2d3`
- Named counterparty / acceded by: `0x5a52d040581A76e2C032542855D31480f2ea7097`
- Verified performance count: `1`
- Performance transaction: <https://explorer-studio.genlayer.com/tx/0x9b10ec6a9395fc2fee910818b6d01e77abc076f0528bec7e384369a8cfa468c4>

Explorer reports consensus `Accepted`, GenVM `SUCCESS`, and `Finalized` for `record_performance`; the hosted accepted-state read independently shows `EFFECTIVE`, the correct `acceded_by` wallet, and `performance_count=1`. See `TESTING.md` for the concise read-only reviewer path.
