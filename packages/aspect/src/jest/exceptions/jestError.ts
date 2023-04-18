export class JestError extends Error {
  constructor(
    message: string,
    private _stack?: string | null,
    public readonly code?: unknown,
    public readonly type?: string
  ) {
    super(message);
  }

  get stack() {
    return this._stack;
  }
}
