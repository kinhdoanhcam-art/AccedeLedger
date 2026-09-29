import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { normalizeText, undertakingId } from "../src/lib/id.ts";

const creator = "0x3065E31B1D993d7C0D59E6786844cBa56780B2d3";
const cases = [
  { name: "U+001C", text: "\u001cAlpha\u001cBeta\u001c" },
  { name: "U+001D", text: "\u001dAlpha\u001dBeta\u001d" },
  { name: "U+001E", text: "\u001eAlpha\u001eBeta\u001e" },
  { name: "U+001F", text: "\u001fAlpha\u001fBeta\u001f" },
  { name: "U+0085", text: "\u0085Alpha\u0085Beta\u0085" },
  { name: "U+FEFF", text: "\ufeffAlpha\ufeffBeta\ufeff" },
  { name: "U+00A0", text: "\u00a0Alpha\u00a0Beta\u00a0" },
  { name: "tab", text: "\tAlpha\tBeta\t" },
  { name: "newline", text: "\nAlpha\nBeta\n" },
  { name: "double space", text: "Alpha  Beta" },
  { name: "edge spaces", text: "  Alpha Beta  " },
  { name: "non-BMP emoji", text: "  Alpha 😀 Beta  " },
].map((entry) => ({ ...entry, creator }));

function runPython(input) {
  const candidates = process.platform === "win32"
    ? [["py", ["-3"]], ["python", []], ["python3", []]]
    : [["python3", []], ["python", []]];

  for (const [command, prefix] of candidates) {
    const result = spawnSync(command, [...prefix, "tests/py_ids.py"], {
      cwd: new URL("..", import.meta.url),
      input: JSON.stringify(input),
      encoding: "utf8",
    });
    if (result.error?.code === "ENOENT") continue;
    if (result.status !== 0) {
      throw new Error(`${command} tests/py_ids.py failed: ${result.stderr || result.stdout}`);
    }
    return JSON.parse(result.stdout);
  }
  throw new Error("Python 3 was not found; parity test cannot run.");
}

const python = runPython(cases);
assert.equal(python.length, cases.length);

for (let index = 0; index < cases.length; index += 1) {
  const testCase = cases[index];
  const reference = python[index];
  assert.equal(reference.name, testCase.name);
  assert.equal(normalizeText(testCase.text), reference.normalized, `${testCase.name} normalization`);
  assert.equal(undertakingId(creator, testCase.text), reference.id, `${testCase.name} id`);
}

assert.equal([..."😀"].length, 1, "JavaScript code-point length");
assert.equal(python.at(-1).normalized, "Alpha 😀 Beta", "Python non-BMP reference");

console.log("PASS JS/Python undertaking-id parity (12 whitespace and Unicode cases)");
console.log("PASS Unicode code-point length parity for non-BMP emoji");
