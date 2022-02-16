import axios from 'axios';
import os from 'os';
import { getGlobalInfo } from 'arco-cli-dev-utils';

interface LogParameters {
  user: {
    username: string;
  };
  event: {
    event: string;
    time: number;
    params: Record<string, any>;
  };
}

export default function teaLog(params: LogParameters['event']['params']) {
  try {
    const globalInfo = getGlobalInfo();
    if (globalInfo && globalInfo.host?.arco) {
      const message: LogParameters = {
        user: {
          username: globalInfo.userInfo?.username || '',
        },
        event: {
          event: 'arco_cli',
          time: +Date.now(),
          params: {
            ...params,
            os: os.type(),
            node: process.version,
          },
        },
      };
      axios.post(`${globalInfo.host.arco}/material/api/log`, message).catch(() => {});
    }
  } catch (err) {}
}
