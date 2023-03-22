import yargs from 'yargs';

/**
 * parse cli args from raw args like: 'jest -u --silent=false; mocha -h'
 */
export function parseCliRawArgs(
  command: string,
  originArgs = ''
): { args: string; parsed: Record<string, any> } {
  const regExp = new RegExp(`^\\s*${command}\\s*`, 'i');
  const args = (originArgs.split(';').find((str) => regExp.test(str)) || '').replace(regExp, '');
  return {
    args,
    parsed: yargs(args).argv,
  };
}
