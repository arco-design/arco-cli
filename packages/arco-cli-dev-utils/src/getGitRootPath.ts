import { spawnSync } from 'child_process';

export default () => {
  const { stdout } = spawnSync('git', ['rev-parse', '--show-toplevel']);
  return stdout.toString().replace(/\n|\s/g, '');
};
