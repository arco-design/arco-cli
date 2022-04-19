import getLocale from '../getLocale';
import zhCN from './zh-CN';
import enUS from './en-US';

export default getLocale() === 'zh-CN' ? zhCN : enUS;
