# Executable test map

- `verify-project.mjs` freezes the deployed contract bytes, method surface, Project address, and public-file isolation gates.
- `ids.mjs` preserves the two original known undertaking-id vectors unchanged.
- `parity.mjs` sends 12 whitespace and Unicode cases to `py_ids.py`, then compares Python normalization and Keccak-256 IDs with the production JavaScript implementation. `py_ids.py` uses Python's own `str.split()` and mirrors `_undertaking_id_for` from `contract/AccedeLedger.py`; its compact Keccak-256 implementation removes any external Python-package requirement.
- `verify-outcome.mjs` executes the receipt-first decision logic and complete-record predicate. It covers a duplicate rollback with a stale different-counterparty record, pending and successful receipts, every field in a fresh record, and repeated accede/decline/contest calls whose target state already exists.

Run all tracked tests from the repository root:

```bash
npm test
```
