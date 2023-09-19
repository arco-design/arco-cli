export function toFsCompatible(str: string) {
  return typeof str === 'string' ? str.replace(/[-\/.]/g, '_') : str;
}
