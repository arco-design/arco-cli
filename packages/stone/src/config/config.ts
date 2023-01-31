export class Config {
  constructor(readonly raw: Map<string, object>) {}

  toObject() {
    return Array.from(this.raw.entries()).reduce<any>((acc, [id, config]) => {
      acc[id] = config;
      return acc;
    }, {});
  }

  set(id: string, config: object) {
    this.raw.set(id, config);
  }

  get(id: string) {
    return this.raw.get(id);
  }

  static from(raw: { [key: string]: object }) {
    return new Config(new Map(Object.entries(raw)));
  }
}
