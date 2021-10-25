const opt = Object.prototype.toString;

export function isObject(obj) {
  return opt.call(obj) === '[object Object]';
}
