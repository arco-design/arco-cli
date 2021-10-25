// Compatible config filed breaking change
export default function compatiblePropertyNameChange(
  obj,
  propertiesChanged: Array<{ prev: string; now: string }>
) {
  return new Proxy(obj, {
    get(obj, propName: string) {
      for (let i = 0; i < propertiesChanged.length; i++) {
        const { prev, now } = propertiesChanged[i];
        if (propName === prev) {
          return obj[now];
        }
      }
      return obj[propName];
    },

    set(obj, propName: string, value) {
      for (let i = 0; i < propertiesChanged.length; i++) {
        const { prev, now } = propertiesChanged[i];
        if (propName === prev) {
          obj[now] = value;
          return true;
        }
      }

      obj[propName] = value;
      return true;
    },
  });
}
