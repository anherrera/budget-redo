import assert from "assert";
import { Meteor } from "meteor/meteor";
import { isValidBalance } from "../imports/api/userMethods";
import { summarizeEvents } from "../imports/util/summarizeEvents";

const setBalance = () => Meteor.server.method_handlers["user.setBalance"];

describe("user.setBalance", function () {
  it("accepts plain numbers and the empty string only", function () {
    ["", "0", "1523.11", "-40.5"].forEach((v) => assert.strictEqual(isValidBalance(v), true, v));
    ["abc", "1+2", "1e9", " 5", 5, null].forEach((v) => assert.strictEqual(isValidBalance(v), false, String(v)));
  });

  it("rejects callers who are not logged in", async function () {
    await assert.rejects(() => setBalance().call({ userId: null }, "10"), /Not authorized/);
  });

  it("stores the balance on the caller's profile", async function () {
    const userId = await Meteor.users.insertAsync({ profile: {} });
    try {
      await setBalance().call({ userId }, "1523.11");
      const user = await Meteor.users.findOneAsync(userId);
      assert.strictEqual(user.profile.balance, "1523.11");
      assert.ok(user.profile.balanceUpdatedAt > 0);
      await assert.rejects(() => setBalance().call({ userId }, "lots"), /Balance must be a number/);
    } finally {
      await Meteor.users.removeAsync(userId);
    }
  });
});

describe("summarizeEvents", function () {
  const evt = (type, amountCents, running, due, extra = {}) => ({ type, amountCents, running, due, ...extra });

  it("returns zeros for no events", function () {
    const s = summarizeEvents([]);
    assert.deepStrictEqual([s.income, s.expenses, s.min, s.series], [0, 0, undefined, []]);
  });

  it("totals by type, ignores skipped amounts, and dates the lowest balance", function () {
    const s = summarizeEvents([
      evt("income", 100000, "1100.00", "11/1/2026"),
      evt("bill", 120000, "-100.00", "11/3/2026"),
      evt("bill", 5000, "-100.00", "11/3/2026", { skipped: true }),
      evt("cc_payment", 2500, "-125.00", "11/5/2026"),
      evt("income", 50000, "375.00", "11/5/2026"),
    ]);
    assert.strictEqual(s.income, 1500);
    assert.strictEqual(s.expenses, 1225);
    assert.strictEqual(s.min, -125);
    assert.strictEqual(s.minDate, "11/5/2026");
    assert.strictEqual(s.max, 1100);
    assert.deepStrictEqual(s.chartCategories, ["11/1/2026", "11/3/2026", "11/5/2026"]);
    assert.deepStrictEqual(s.series, [1100, -100, 375]);
  });
});
