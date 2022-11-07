import { CLI_VERSION } from '../constants';
import { PackData } from './packCommand';

export default function buildCommandMessage(
  payload: any,
  context,
  compress = true,
  extraHeaders = {}
): PackData {
  return {
    payload,
    headers: {
      version: CLI_VERSION,
      compressed: compress,
      ...extraHeaders,
      context,
    },
  };
}
