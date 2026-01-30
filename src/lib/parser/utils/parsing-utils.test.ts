import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  ensureArray,
  matchAnswer,
  matchIdentifier,
  matchNonEmptyStrings,
  splitWithDoubleLines,
  splitWithNewlines,
} from "./parsing-utils";

describe("splitWithNewlines", () => {
  test("splits CRLF text", () => {
    assert.deepEqual(splitWithNewlines("qwe\r\nasd\r\nzxc"), ["qwe", "asd", "zxc"]);
  });

  test("splits LF text", () => {
    assert.deepEqual(splitWithNewlines("qwe\nasd\nzxc"), ["qwe", "asd", "zxc"]);
  });

  test("splits mixed text", () => {
    assert.deepEqual(splitWithNewlines("qwe\r\nasd\nzxc"), ["qwe", "asd", "zxc"]);
  });
});

describe("splitWithDoubleLines", () => {
  test("splits CRLF blocks", () => {
    assert.deepEqual(splitWithDoubleLines("qwe\r\n\r\nasd\r\n\r\nzxc"), ["qwe", "asd", "zxc"]);
  });

  test("splits LF blocks", () => {
    assert.deepEqual(splitWithDoubleLines("qwe\n\nasd\n\nzxc"), ["qwe", "asd", "zxc"]);
  });

  test("splits mixed blocks", () => {
    assert.deepEqual(splitWithDoubleLines("qwe\r\n\nasd\n\r\nzxc"), ["qwe", "asd", "zxc"]);
  });

  test("splits when more than two newlines appear", () => {
    assert.deepEqual(splitWithDoubleLines("qwe\n\n\nasd\n\nzxc"), ["qwe", "asd", "zxc"]);
  });
});

describe("matchAnswer", () => {
  test("matches correct answers with single marker", () => {
    const result = matchAnswer("> a) test");
    assert.ok(result);
    assert.equal(result?.correct, true);
    assert.equal(result?.letter, "a");
    assert.equal(result?.content, "test");
  });

  test("matches correct answers with multiple markers", () => {
    const result = matchAnswer(">>> a) spaced");
    assert.ok(result);
    assert.equal(result?.correct, true);
    assert.equal(result?.letter, "a");
    assert.equal(result?.content, "spaced");
  });

  test("parses answer letters case-insensitively", () => {
    const lower = matchAnswer("> a) test");
    const upper = matchAnswer("> A) test");
    assert.equal(lower?.letter, "a");
    assert.equal(upper?.letter, "A");
  });

  test("handles whitespace before and after markers", () => {
    const correct = matchAnswer(" \t > a) test");
    const incorrect = matchAnswer(" \t a) test");
    assert.equal(correct?.correct, true);
    assert.equal(incorrect?.correct, false);
  });

  test("rejects non-letter identifiers or missing identifiers", () => {
    assert.equal(matchAnswer("2) content"), null);
    assert.equal(matchAnswer("#) content"), null);
    assert.equal(matchAnswer(") content"), null);
    assert.equal(matchAnswer("content"), null);
    assert.equal(matchAnswer(">content"), null);
  });
});

describe("matchIdentifier", () => {
  test("captures identifier and content", () => {
    const result = matchIdentifier("[#1] content \n test");
    assert.ok(result);
    assert.equal(result?.identifier, "1");
    assert.equal(result?.content, "content \n test");
  });

  test("allows symbols in identifier", () => {
    const result = matchIdentifier("[#+1a_-] content");
    assert.ok(result);
    assert.equal(result?.identifier, "+1a_-");
  });

  test("rejects malformed identifiers", () => {
    assert.equal(matchIdentifier("[#$] content"), null);
    assert.equal(matchIdentifier(" [#1] content"), null);
    assert.equal(matchIdentifier("content"), null);
  });

  test("allows empty content", () => {
    const result = matchIdentifier("[#1] \t ");
    assert.ok(result);
    assert.equal(result?.content, "");
  });
});

describe("matchNonEmptyStrings", () => {
  test("rejects empty or whitespace-only strings", () => {
    for (const value of ["", " ", "\n", "\r", "\r\n", "\t", "\n\n", "\n \n"]) {
      assert.equal(matchNonEmptyStrings(value), false);
    }
  });

  test("accepts non-empty strings", () => {
    for (const value of ["a", "XYZ", " a ", " \t\n\nx\r\r  ", "a     \r     z"]) {
      assert.equal(matchNonEmptyStrings(value), true);
    }
  });
});

describe("ensureArray", () => {
  test("returns input when it is an array", () => {
    const log: string[] = [];
    const items = ensureArray<number>([1, 2, 3], message => log.push(message), "items");
    assert.deepEqual(items, [1, 2, 3]);
    assert.deepEqual(log, []);
  });

  test("returns empty array and logs when not an array", () => {
    const log: string[] = [];
    const items = ensureArray<number>("nope", message => log.push(message), "items");
    assert.deepEqual(items, []);
    assert.deepEqual(log, ["items must be an array"]);
  });
});
