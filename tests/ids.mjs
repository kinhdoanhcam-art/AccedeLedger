import { keccak256, stringToBytes } from "viem";

const creator = "0x3065E31B1D993d7C0D59E6786844cBa56780B2d3";
const cases = [
  [
    "We will not ship without the Supplier's written approval.",
    "a54a77c92ff1f6ec313fbc66954e0381e936a4528cc4e078c0c21fb552c2cdb0",
  ],
  [
    "We will receive monthly reports from the Supplier by the fifth of each month.",
    "38ee48cb56e63a830600ef280b009ccbb8c63630631ff066b47b1a3217f8ba5e",
  ],
];

for (const [text, expected] of cases) {
  const normalized = text.trim().split(/\s+/u).join(" ");
  const payload = `OUTSIDE_DUTY_BIND:UNDERTAKING:V1|${creator.toLowerCase()}|${[...normalized].length}|${normalized}`;
  const actual = keccak256(stringToBytes(payload)).slice(2);
  if (actual !== expected) {
    console.error(`FAIL undertaking id\nexpected ${expected}\nactual   ${actual}`);
    process.exit(1);
  }
}

console.log("PASS frontend undertaking-id derivation (2 known vectors)");
