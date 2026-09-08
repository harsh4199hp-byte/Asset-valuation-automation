import assert from "node:assert/strict";
import { FixedDecimal, moneyString } from "../src/money.mjs";

assert.equal(FixedDecimal.from("0.1").add("0.2").toString(6), "0.3");
assert.equal(FixedDecimal.from("423990").mul("1.18").mul("1.05").toString(2), "525323.61");
assert.equal(FixedDecimal.from("525323.61").mul("2").toString(2), "1050647.22");
assert.equal(moneyString("1234.5678", 2), "1234.57");
assert.equal(FixedDecimal.from("1.005").toString(6), "1.005");
assert.equal(moneyString("1.005", 2), "1.01");
console.log("money tests passed");
