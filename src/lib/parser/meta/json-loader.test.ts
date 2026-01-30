import assert from "node:assert/strict";
import { describe, test } from "node:test";

import { JsonLoader } from "./json-loader";

describe("JsonLoader", () => {
  test("throws on invalid JSON input", () => {
    const loader = new JsonLoader({});
    assert.throws(() => loader.load("wtf"));
  });

  test("parses valid input with mapper", () => {
    const loader = new JsonLoader({ test: value => value });
    const result = loader.load('{ "test": true }');
    assert.equal(result.object.test, true);
    assert.deepEqual(result.unknown, []);
  });

  test("passes missing members to mappers", () => {
    const spy: Array<unknown> = [];
    const loader = new JsonLoader({
      test: (value, member) => {
        spy.push([value, member]);
        return "mapped";
      },
    });
    const result = loader.load("{}");
    assert.deepEqual(spy, [[undefined, "test"]]);
    assert.equal(result.object.test, "mapped");
    assert.deepEqual(result.unknown, []);
  });

  test("reports members without matching mappers", () => {
    const loader = new JsonLoader({});
    const result = loader.load('{ "test": null }');
    assert.deepEqual(result.unknown, ["test"]);
    assert.deepEqual(result.object, {});
  });

  test("passes field name as second argument", () => {
    const calls: Array<[unknown, string]> = [];
    const loader = new JsonLoader({
      test: (value, member) => {
        calls.push([value, member]);
        return "ok";
      },
    });
    loader.load('{ "test": null }');
    assert.deepEqual(calls, [[null, "test"]]);
  });

  test("handles compound mapper results", () => {
    const loader = new JsonLoader({
      test: () => ({ field1: "one", field2: "two" }),
    });
    const result = loader.load('{ "test": null }');
    assert.equal(result.object.field1, "one");
    assert.equal(result.object.field2, "two");
    assert.deepEqual(result.unknown, []);
  });

  test("logs mapper exceptions", () => {
    const log: string[] = [];
    const loader = new JsonLoader({
      a_valid: () => "valid",
      invalid: () => {
        throw new Error("test error");
      },
      z_valid: () => "valid",
    });
    loader.load('{"a_valid": true, "invalid": true, "z_valid": true}', message => log.push(message));
    assert.deepEqual(log, ["Mapper invalid threw an exception"]);
  });

  test("throws for repeated members produced by mappers", () => {
    const loader = new JsonLoader({
      a: () => ({ dupe: true }),
      b: () => ({ dupe: true }),
    });
    assert.throws(() => loader.load('{"a": true, "b": true}'), /Member dupe already exists/);
  });
});
