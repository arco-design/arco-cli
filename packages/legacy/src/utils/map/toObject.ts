/**
 * Cast a `Map` to a plain object.
 * Keys are being cast by invoking `toString` on each key.
 */
export default function mapToObject(map: Map<any, any>): Record<string, any> {
  const object = {};
  map.forEach((val, key) => {
    object[key.toString()] = val;
  });
  return object;
}
