/**
 * encode a string or a buffer to base64
 * @example
 * ```js
 *  toBase64('foo bar') // => Zm9vIGJhcg==
 *  toBase64(Buffer.from('foo bar')) // => Zm9vIGJhcg==
 * ```
 */
export default function toBase64(val: string | Buffer) {
  return (val instanceof Buffer ? val : Buffer.from(val)).toString('base64');
}
