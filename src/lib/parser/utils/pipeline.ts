export type LogFn = (message: string) => void;

export class Pipeline<T> {
  private readonly log: string[];
  private data: T;

  constructor(data: T, log: string[] = []) {
    this.data = data;
    this.log = log;
  }

  private logAppender: LogFn = message => {
    this.log.push(message);
  };

  apply<U>(fn: (input: T, log: LogFn) => U): Pipeline<U> {
    const next = fn(this.data, this.logAppender);
    return new Pipeline<U>(next, this.log);
  }

  map<Item, Result>(fn: (item: Item, log: LogFn) => Result): Pipeline<Result[]> {
    if (!Array.isArray(this.data)) {
      throw new Error("Pipeline content is not an array");
    }
    const mapped = (this.data as unknown as Item[]).map(item => fn(item, this.logAppender));
    return new Pipeline<Result[]>(mapped, this.log);
  }

  filter<Item>(fn: (item: Item, log: LogFn) => boolean): Pipeline<Item[]> {
    if (!Array.isArray(this.data)) {
      throw new Error("Pipeline content is not an array");
    }
    const filtered = (this.data as unknown as Item[]).filter(item => fn(item, this.logAppender));
    return new Pipeline<Item[]>(filtered, this.log);
  }

  get(): T {
    return this.data;
  }

  getLog(): string[] {
    return [...this.log];
  }
}
