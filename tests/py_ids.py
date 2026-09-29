#!/usr/bin/env python3
"""Python reference for AccedeLedger undertaking-id parity tests.

The normalization and payload below mirror contract/AccedeLedger.py
_normalize_text and _undertaking_id_for. Python's own str.split() is used so
the reference keeps Python's whitespace semantics rather than duplicating the
JavaScript implementation under test.
"""

import json
import sys


MASK_64 = (1 << 64) - 1
ROTATION = (
    0, 1, 62, 28, 27,
    36, 44, 6, 55, 20,
    3, 10, 43, 25, 39,
    41, 45, 15, 21, 8,
    18, 2, 61, 56, 14,
)
ROUND_CONSTANTS = (
    0x0000000000000001, 0x0000000000008082,
    0x800000000000808A, 0x8000000080008000,
    0x000000000000808B, 0x0000000080000001,
    0x8000000080008081, 0x8000000000008009,
    0x000000000000008A, 0x0000000000000088,
    0x0000000080008009, 0x000000008000000A,
    0x000000008000808B, 0x800000000000008B,
    0x8000000000008089, 0x8000000000008003,
    0x8000000000008002, 0x8000000000000080,
    0x000000000000800A, 0x800000008000000A,
    0x8000000080008081, 0x8000000000008080,
    0x0000000080000001, 0x8000000080008008,
)


def _rotate_left(value: int, amount: int) -> int:
    if amount == 0:
        return value & MASK_64
    return ((value << amount) | (value >> (64 - amount))) & MASK_64


def _keccak_f1600(state: list[int]) -> None:
    for round_constant in ROUND_CONSTANTS:
        columns = [
            state[x] ^ state[x + 5] ^ state[x + 10] ^ state[x + 15] ^ state[x + 20]
            for x in range(5)
        ]
        deltas = [columns[(x - 1) % 5] ^ _rotate_left(columns[(x + 1) % 5], 1) for x in range(5)]
        for y in range(5):
            for x in range(5):
                state[x + 5 * y] ^= deltas[x]

        moved = [0] * 25
        for y in range(5):
            for x in range(5):
                moved[y + 5 * ((2 * x + 3 * y) % 5)] = _rotate_left(
                    state[x + 5 * y], ROTATION[x + 5 * y]
                )

        for y in range(5):
            row = [moved[x + 5 * y] for x in range(5)]
            for x in range(5):
                state[x + 5 * y] = (
                    row[x] ^ ((~row[(x + 1) % 5]) & row[(x + 2) % 5])
                ) & MASK_64

        state[0] ^= round_constant


def _keccak_256(data: bytes) -> str:
    rate = 136
    padded = bytearray(data)
    padded.append(0x01)
    while len(padded) % rate != rate - 1:
        padded.append(0)
    padded.append(0x80)

    state = [0] * 25
    for offset in range(0, len(padded), rate):
        block = padded[offset:offset + rate]
        for lane in range(rate // 8):
            start = lane * 8
            state[lane] ^= int.from_bytes(block[start:start + 8], "little")
        _keccak_f1600(state)

    output = bytearray()
    for lane in range(rate // 8):
        output.extend(state[lane].to_bytes(8, "little"))
        if len(output) >= 32:
            return bytes(output[:32]).hex()
    raise RuntimeError("unreachable")


def _normalize_text(value: str) -> str:
    return " ".join(value.split())


def _undertaking_id_for(creator: str, text: str) -> str:
    normalized = _normalize_text(text)
    payload = (
        "OUTSIDE_DUTY_BIND:UNDERTAKING:V1|"
        + creator.lower()
        + "|"
        + str(len(normalized))
        + "|"
        + normalized
    )
    return _keccak_256(payload.encode("utf-8"))


def main() -> None:
    cases = json.load(sys.stdin)
    output = [
        {
            "name": case["name"],
            "normalized": _normalize_text(case["text"]),
            "id": _undertaking_id_for(case["creator"], case["text"]),
        }
        for case in cases
    ]
    json.dump(output, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
