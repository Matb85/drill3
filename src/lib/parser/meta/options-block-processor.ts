import { JsonLoader } from "./json-loader";
import type { LogFn } from "../utils/pipeline";

export type ParsedOptions = {
  fileFormat?: string;
  markdownReady?: boolean;
  markdown?: boolean;
  mathjaxReady?: boolean;
  mathjax?: boolean;
  gradingMethod?: "perQuestion" | "perAnswer" | "custom";
  customGrader?: string;
  gradingRadical?: string;
  gradingPPQ?: number;
  timeLimitEnabled?: boolean;
  timeLimitSecs?: number;
  repeatIncorrect?: boolean;
  displayAsRadio?: boolean;
  explain?: "summary" | "optional" | "always";
  showExplanations?: boolean;
  explanations?: Record<string, string>;
  relatedLinks?: Record<string, string[]>;
  explanationsAvailable?: boolean;
};

const parseBool = (value: unknown): boolean => {
  if (!value) return false;
  const lowered = typeof value === "string" ? value.toLowerCase() : "";
  if (["false", "no", "disabled", "disable", "0"].includes(lowered)) return false;
  return true;
};

const genericIdValueMapper =
  (
    blockKey: "explanations" | "relatedLinks",
    itemValidator: (value: unknown, key: string, logFn: LogFn) => boolean,
    itemTransformer: (value: unknown) => unknown = v => v,
  ) =>
  (value: unknown, _member: string, logFn: LogFn) => {
    const failureRet: Record<string, Record<string, unknown>> = { [blockKey]: {} };
    if (value === undefined) return failureRet;
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      logFn(`Invalid ${blockKey} object (type: ${Array.isArray(value) ? "array" : typeof value})`);
      return failureRet;
    }

    const result: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(value)) {
      if (!/^[A-Z\d\-+_]+$/i.exec(key)) {
        logFn(`Invalid ${blockKey} key '${key}'`);
      } else if (itemValidator(raw, key, logFn)) {
        result[key] = itemTransformer(raw);
      }
    }

    return { [blockKey]: result };
  };

const v2mappers: Record<string, (value: unknown, member: string, logFn: LogFn) => unknown> = {
  format: v => {
    if (!v) return "legacy";
    if (v === "legacy" || v === "2" || v === "2.1") return v;
    return "unknown";
  },
  markdown: v => {
    const parsed = parseBool(v);
    return { markdownReady: parsed, markdown: parsed };
  },
  mathjax: v => {
    const parsed = parseBool(v);
    return { mathjaxReady: parsed, mathjax: parsed };
  },
  grading: (v, _m, logFn) => {
    if (v === "perQuestion" || v === "perAnswer") return { gradingMethod: v };
    const matched = typeof v === "string" ? /^custom: *(.+)$/.exec(v) : null;
    if (matched) {
      try {
        // In the legacy app this was executed; here we just syntax check by constructing a Function
        // but we do not execute arbitrary user code.
        // eslint-disable-next-line no-new-func
        new Function("id", matched[1]);
        return { gradingMethod: "custom", customGrader: matched[1] };
      } catch (error) {
        logFn("Custom grader caused an error while being tested");
        return { gradingMethod: "perAnswer" };
      }
    }
    if (v) logFn("Grader spec isn't recognized as a valid expression");
    return { gradingMethod: "perAnswer" };
  },
  gradingRadical: v => (parseBool(v) ? "1" : "0"),
  gradingPPQ: v => Number.parseInt(String(v), 10) || 1,
  timeLimit: v => {
    const seconds = Number.parseInt(String(v), 10);
    if (Number.isFinite(seconds)) {
      const rounded = (seconds / 5) * 5;
      return { timeLimitEnabled: true, timeLimitSecs: rounded };
    }
    return { timeLimitEnabled: false, timeLimitSecs: 60 };
  },
  repeatIncorrect: parseBool,
  displayAsRadio: parseBool,
  explain: (vOrig, _m, logFn) => {
    const lowered = typeof vOrig === "string" ? vOrig.toLowerCase() : "";
    if (lowered === "summary" || lowered === "optional" || lowered === "always") {
      return { explain: lowered as ParsedOptions["explain"], showExplanations: lowered === "always" };
    }
    if (vOrig) {
      logFn(`Unsupported explanations mode '${vOrig}', falling back to 'optional'`);
    }
    return { explain: "optional" as const, showExplanations: false };
  },
  explanations: genericIdValueMapper(
    "explanations",
    (value, key, logFn) => {
      if (typeof value !== "string") {
        logFn(`Value of explanation '${key}' is not a string`);
        return false;
      }
      if (value.trim().length === 0) {
        logFn(`Value of explanation '${key}' is empty`);
        return false;
      }
      return true;
    },
    v => v,
  ),
  relatedLinks: genericIdValueMapper(
    "relatedLinks",
    (value, key, logFn) => {
      if (Array.isArray(value)) {
        const valid = value.every(item => typeof item === "string");
        if (!valid) logFn(`Related link '${key}' contains non-string value`);
        return valid;
      }
      if (typeof value === "string") return true;
      logFn(`Value of related link '${key}' is not an array or string`);
      return false;
    },
    value => (Array.isArray(value) ? value : [value as string]),
  ),
};

export class OptionsBlockProcessor {
  process(str: string, logFn: LogFn = () => undefined): ParsedOptions {
    try {
      const result = new JsonLoader(v2mappers).load(str, logFn);
      for (const property of result.unknown) {
        logFn(`Unknown option ${property}`);
      }
      return result.object as ParsedOptions;
    } catch (error) {
      const matched = /[a-z\d_-]*Error/i.exec(String(error));
      const errorType = matched?.[0];
      if (errorType === "SyntaxError") {
        logFn("Syntax error in <options> block - parsing failed");
      } else if (errorType) {
        logFn(`Parsing <options> block failed - ${errorType}`);
      } else {
        logFn("Parsing <options> block failed");
      }
      return new JsonLoader(v2mappers).load("{}", logFn).object as ParsedOptions;
    }
  }
}
