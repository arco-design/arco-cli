export default function toFsCompatible(str: string) {
  return typeof str === 'string'
    ? str.replace(/\//g, '_').replace(/\./g, '_').replace(/-/g, '_')
    : str;
}
