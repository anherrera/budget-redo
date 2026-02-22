import assert from "assert";
import { applyRunningBalance, getAmountCents, sortByTimestampDeterministic } from "../imports/util/runningBalance";

if (Meteor.isServer) {
  describe("running balance helpers", function () {
    it("converts amountCents directly and falls back to legacy amount", function () {
      assert.strictEqual(getAmountCents({ amountCents: 1234 }), 1234);
      assert.strictEqual(getAmountCents({ amount: "12.34" }), 1234);
      assert.strictEqual(getAmountCents({ amount: "abc" }), 0);
    });

    it("sorts deterministically by timestamp with stable tie breakers", function () {
      const sorted = sortByTimestampDeterministic([
        { _id: "b", listId: "x2", timestamp: 1000 },
        { _id: "a", listId: "x1", timestamp: 1000 },
        { _id: "c", listId: "x0", timestamp: 500 },
      ]);

      assert.deepStrictEqual(
        sorted.map((evt) => evt._id),
        ["c", "a", "b"]
      );
    });

    it("applies running balance in sorted order for bill/income/cc_payment", function () {
      const projected = applyRunningBalance(
        [
          { _id: "2", listId: "B", timestamp: 2000, type: "income", amountCents: 5000 },
          { _id: "1", listId: "A", timestamp: 1000, type: "bill", amountCents: 2000 },
          { _id: "3", listId: "C", timestamp: 2000, type: "cc_payment", amountCents: 1000 },
        ],
        "100.00"
      );

      assert.deepStrictEqual(
        projected.map((evt) => evt._id),
        ["1", "2", "3"]
      );
      assert.deepStrictEqual(
        projected.map((evt) => evt.running),
        ["80.00", "130.00", "120.00"]
      );
    });

    it("uses zero start when balance input is invalid", function () {
      const projected = applyRunningBalance(
        [{ _id: "1", listId: "A", timestamp: 1, type: "income", amountCents: 123 }],
        "bad"
      );
      assert.strictEqual(projected[0].running, "1.23");
    });
  });
}
