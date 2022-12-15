import axios from 'axios';
import { print, getGlobalInfo } from 'arco-cli-dev-utils';

const ARCO_TOKEN = 'x-arco-token';
const TIMEOUT_REQUEST = 1000 * 15;

const request = (
  method: 'all' | 'get' | 'delete' | 'post' | 'put',
  {
    url,
    data = {},
    option = {},
  }: { url: string; data?: { [key: string]: any }; option?: { [key: string]: any } }
) => {
  const cliConfig = getGlobalInfo();
  const instance = axios.create({
    baseURL: `${cliConfig.host.arco}/material/api/`,
    timeout: TIMEOUT_REQUEST,
  });

  option.headers = {
    ...option.headers,
    [ARCO_TOKEN]:
      (option.headers && option.headers[ARCO_TOKEN]) || (cliConfig && cliConfig[ARCO_TOKEN]) || '',
    'x-arco-dev': '1',
  };

  const req =
    method === 'get' || method === 'delete'
      ? instance[method](url, option)
      : instance[method](url, data, option);

  return req
    .then((res) => {
      return res.data;
    })
    .catch((err) => {
      print.error(err);
      return Promise.reject(err);
    });
};

export default {
  all: (arr) => {
    return axios.all(arr);
  },
  get: (url, option?) => request('get', { url, option }),
  delete: (url, option?) => request('delete', { url, option }),
  post: (url, data?, option?) => request('post', { url, option, data }),
  put: (url, data?, option?) => request('put', { url, option, data }),
};
