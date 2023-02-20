import axios from 'axios';
import logger from '../logger';
import { getSync } from '../globalConfig';
import { CFG_HOST_ARCO_KEY, CFG_USER_TOKEN_KEY } from '../constants';

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
  const hostArco = getSync(CFG_HOST_ARCO_KEY);
  const userToken = getSync(CFG_USER_TOKEN_KEY);
  const baseURL = `http${
    hostArco.indexOf('localhost') > -1 ? '' : 's'
  }://${hostArco}/material/api/`;

  const instance = axios.create({
    baseURL,
    timeout: TIMEOUT_REQUEST,
  });

  option.headers = {
    ...option.headers,
    [ARCO_TOKEN]: (option.headers && option.headers[ARCO_TOKEN]) || userToken || '',
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
      logger.error(`failed to request ${baseURL}${url}`, err);
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
