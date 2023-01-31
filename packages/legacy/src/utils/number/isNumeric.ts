/**
 * determines whether `val` is a numeric value
 */
export default function isNumeric(val: any) {
  return !Number.isNaN(parseFloat(val)) && Number.isFinite(val);
}
