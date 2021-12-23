import { sync } from 'os-locale';
import getGlobalInfo from './getGlobalInfo';

export default function getLocale(): string {
  const { locale } = getGlobalInfo();
  return locale && locale !== 'system' ? locale : sync();
}
