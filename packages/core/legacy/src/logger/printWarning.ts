import chalk from 'chalk';
import { getSync } from '../globalConfig';
import { CFG_NO_WARNINGS } from '../constants';

export default function printWarning(msg: string) {
  const cfgNoWarnings = getSync(CFG_NO_WARNINGS);
  if (cfgNoWarnings !== 'true') {
    console.log(chalk.yellow(`Warning: ${msg}`));
  }
}
