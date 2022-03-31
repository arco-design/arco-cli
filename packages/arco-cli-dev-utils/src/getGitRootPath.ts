import { spawnSync } from 'child_process';

// Do NOT change this function to async, it's used by others
export default () => {
  const { stdout } = spawnSync('git rev-parse --show-toplevel', { shell: true });
  return stdout.toString().replace(/\n|\s/g, '');
};
