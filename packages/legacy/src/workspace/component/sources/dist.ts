import AbstractVinyl from './abstractVinyl';

export default class Dist extends AbstractVinyl {
  static loadFromParsedString(parsedString: Record<string, any>): Dist | null {
    if (!parsedString) return null;
    const opts = super.loadFromParsedStringBase(parsedString);
    return new Dist(opts);
  }

  static loadFromParsedStringArray(arr: Record<string, any>[]): Dist[] | null {
    return arr ? arr.map(this.loadFromParsedString) : null;
  }

  clone(_opts?: { contents?: boolean; deep?: boolean } | boolean): this {
    // @ts-ignore
    return new Dist(this);
  }
}
