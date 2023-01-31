export type Serializable =
  | string
  | {
      /**
       * serialize the object into a string.
       */
      toString(): string;
    };

export type SerializableMap = {
  [key: string]: Serializable;
};

export class DocProp {
  constructor(
    /**
     * name of the doc property.
     */
    readonly name: string,

    /**
     * value of the doc property.
     */
    readonly value: Serializable
  ) {}

  getAs<T>() {
    return this.value as T;
  }
}
