import zlib from 'zlib';
import toBase64 from './string/toBase64';

export type PackData = { payload: any; headers: any };

export default function packCommand(obj: PackData, base64 = true, compress = true): string {
  if (compress) {
    if (obj.payload) {
      obj.payload = zlib.deflateSync(JSON.stringify(obj.payload));
    }

    if (obj.headers && obj.headers.context) {
      obj.headers.context = zlib.deflateSync(JSON.stringify(obj.headers.context));
    }
  }

  return base64 ? toBase64(JSON.stringify(obj)) : JSON.stringify(obj);
}
