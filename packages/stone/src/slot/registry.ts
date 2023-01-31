export class SlotRegistry<T> {
  constructor(private registerFn: () => string, readonly map = new Map<string, T>()) {}

  get(id: string): T | undefined {
    return this.map.get(id);
  }

  toArray() {
    return Array.from(this.map.entries());
  }

  values() {
    return Array.from(this.map.values());
  }

  register(value: T) {
    const id = this.registerFn();
    this.map.set(id, value);
  }
}
