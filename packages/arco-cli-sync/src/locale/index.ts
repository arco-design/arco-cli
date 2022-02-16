import { getLocale } from 'arco-cli-dev-utils';
import zhCN from './zh-CN';
import enUS from './en-US';

export default getLocale() === 'zh-CN' ? zhCN : enUS;
