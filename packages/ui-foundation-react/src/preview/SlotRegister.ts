export class SlotRegister<T = any> {
  constructor(readonly map = new Map<string, T>()) {}

  get(id: string) {
    return this.map.get(id);
  }

  toArray() {
    return Array.from(this.map.entries());
  }

  values() {
    return Array.from(this.map.values());
  }

  unregister(id: string) {
    this.map.delete(id);
  }

  register(cb: T) {
    const id = Math.random().toFixed(8).slice(2);
    this.map.set(id, cb);
    return () => this.unregister(id);
  }
}
