import { spawnSync } from 'child_process';

export default () => {
  try {
    const { stdout } = spawnSync('git', ['status', '--short']);
    return stdout.toString() === '';
  } catch (e) {
    return true;
  }
};
