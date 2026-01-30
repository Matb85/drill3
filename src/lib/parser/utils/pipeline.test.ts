import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { Pipeline } from "./pipeline";

describe("Pipeline", () => {
  test("returns the initial value when untouched", () => {
    const input = { value: 1 };
    const pipeline = new Pipeline(input);
    assert.equal(pipeline.get(), input);
    assert.deepEqual(pipeline.getLog(), []);
  });

  test("applies a single function and returns a new pipeline", () => {
    const pipeline = new Pipeline("abc");
    const next = pipeline.apply(value => value.toUpperCase());
    assert.equal(next.get(), "ABC");
    assert.equal(pipeline.get(), "abc");
  });

  test("chains multiple apply steps", () => {
    const pipeline = new Pipeline("abc");
    const result = pipeline
      .apply(value => value.toUpperCase())
      .apply(value => `${value}xyz`)
      .get();
    assert.equal(result, "ABCxyz");
  });

  test("maps items when value is an array", () => {
    const pipeline = new Pipeline(["a", "b", "c"]);
    const mapped = pipeline.map((value: string) => value.toUpperCase()).get();
    assert.deepEqual(mapped, ["A", "B", "C"]);
  });

  test("throws when mapping a non-array", () => {
    const pipeline = new Pipeline("non-array");
    assert.throws(() => pipeline.map(v => v));
  });

  test("filters items when value is an array", () => {
    const pipeline = new Pipeline([1, 2, 3, 4]);
    const filtered = pipeline.filter((value: number) => value % 2 === 0).get();
    assert.deepEqual(filtered, [2, 4]);
  });

  test("throws when filtering a non-array", () => {
    const pipeline = new Pipeline("non-array");
    assert.throws(() => pipeline.filter(() => true));
  });

  test("supports chaining map and filter", () => {
    const pipeline = new Pipeline([true, false, true]);
    const result = pipeline
      .map(value => ({ value }))
      .filter((item: { value: boolean }) => item.value)
      .get();
    assert.deepEqual(result, [{ value: true }, { value: true }]);
  });

  test("collects log entries from apply", () => {
    const pipeline = new Pipeline("asd");
    const next = pipeline
      .apply((value, log) => {
        log("first");
        return value;
      })
      .apply((value, log) => {
        log("second");
        return value;
      });
    assert.deepEqual(next.getLog(), ["first", "second"]);
  });

  test("collects log entries from map", () => {
    const pipeline = new Pipeline(["value"]);
    const next = pipeline
      .map((value: string, log) => {
        log(`seen:${value}`);
        return value.toUpperCase();
      })
      .map((value: string, log) => {
        log(`again:${value}`);
        return value;
      });
    assert.deepEqual(next.getLog(), ["seen:value", "again:VALUE"]);
  });

  test("collects log entries from filter", () => {
    const pipeline = new Pipeline([1, 2, 3, 4]);
    const next = pipeline
      .filter((value: number, log) => {
        if (value % 2 !== 0) log(`odd:${value}`);
        return true;
      })
      .filter((value: number, log) => {
        if (value % 2 === 0) log(`even:${value}`);
        return false;
      });
    assert.deepEqual(next.getLog(), ["odd:1", "odd:3", "even:2", "even:4"]);
  });

  test("keeps logs isolated per instance", () => {
    const tee = (value: number, log: (msg: string) => void) => {
      log(String(value));
      return true;
    };
    const first = new Pipeline([1, 2, 3]).filter(tee);
    const second = new Pipeline([1, 2, 3]).filter(tee);
    assert.deepEqual(first.getLog(), ["1", "2", "3"]);
    assert.deepEqual(second.getLog(), ["1", "2", "3"]);
  });
});
