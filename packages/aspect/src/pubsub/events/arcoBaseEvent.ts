export class ArcoBaseEvent<T> {
  constructor(
    readonly type: string,
    readonly version: string,
    readonly timestamp: number,
    readonly data: T
  ) {}
}
