import type { LogFn } from "../utils/pipeline";

type Mapper = (value: unknown, member: string, logFn: LogFn) => unknown;

type Mappers = Record<string, Mapper>;

export class JsonLoader {
  constructor(private readonly mappers: Mappers) {}

  load(json: string, logFn: LogFn = () => undefined) {
    const input = JSON.parse(json) as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const member of Object.keys(this.mappers)) {
      try {
        const mappedValue = this.mappers[member](input[member], member, logFn);
        if (mappedValue === undefined) continue;
        if (mappedValue !== null && typeof mappedValue === "object" && !Array.isArray(mappedValue)) {
          for (const [valueMember, value] of Object.entries(mappedValue)) {
            if (valueMember in output) {
              throw new Error(`Member ${valueMember} already exists`);
            }
            output[valueMember] = value;
          }
        } else {
          output[member] = mappedValue;
        }
      } catch (error) {
        logFn(`Mapper ${member} threw an exception`);
      }
    }

    const unknown = Object.keys(input).filter(member => !(member in this.mappers));

    return { object: output, unknown } as const;
  }
}
