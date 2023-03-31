import yargs from 'yargs';

const ENV_JEST_ARGS = process.env.JEST_ARGS;

/**
 * parse cli args from raw args like: 'jest -u --silent=false; mocha -h'
 */
export function parseCliRawArgs(
  command: 'jest',
  originArgs = ''
): { args: string; parsed: Record<string, any> } {
  const argsFromEnv = command === 'jest' ? ENV_JEST_ARGS : null;
  const regExp = new RegExp(`^\\s*${command}\\s*`, 'i');
  const args =
    argsFromEnv ||
    (originArgs.split(';').find((str) => regExp.test(str)) || '').replace(regExp, '');
  return {
    args,
    parsed: yargs(args).argv,
  };
}
