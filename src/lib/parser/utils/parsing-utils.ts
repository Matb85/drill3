import type { LogFn } from "./pipeline";

export type IdentifierMatch = { identifier: string; content: string };
export type AnswerMatch = { correct: boolean; letter: string; content: string };

export const splitWithNewlines = (input: string): string[] => input.split(/(?:\r?\n)/);

export const splitWithDoubleLines = (input: string | string[], _log?: LogFn): string[] => {
  const source = Array.isArray(input) ? input.join("\n\n") : input;
  return source.split(/(?:\r?\n){2,}/);
};

export function matchAnswer(str: string): AnswerMatch | null {
  const match = /^\s*(>+)?\s*([A-Z])\)\s*([\s\S]+)$/i.exec(str);
  if (!match) return null;
  return {
    correct: Boolean(match[1]),
    letter: match[2],
    content: match[3],
  };
}

export function matchIdentifier(str: string): IdentifierMatch | null {
  const match = /^\[#([A-Z\d\-+_]+)]\s*([\s\S]*)$/i.exec(str);
  if (!match) return null;
  return {
    identifier: match[1],
    content: match[2],
  };
}

export const matchNonEmptyStrings = (str: string, _log?: LogFn): boolean => str.trim().length > 0;

export const ensureArray = <T>(value: unknown, logFn: LogFn, label: string): T[] => {
  if (!Array.isArray(value)) {
    logFn(`${label} must be an array`);
    return [];
  }
  return value as T[];
};
