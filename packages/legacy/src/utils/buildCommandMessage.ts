import { getCliVersion } from './cliVersion';
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
      version: getCliVersion(),
      compressed: compress,
      ...extraHeaders,
      context,
    },
  };
}
