import { TextEncoder } from 'util';

export default function encodeInfo(info: Record<string, any>): string {
  const encoder = new TextEncoder();
  return encoder.encode(JSON.stringify(info)).join(',');
}
