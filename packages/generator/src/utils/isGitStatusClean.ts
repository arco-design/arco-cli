import execQuick from './execQuick';

export default async () => {
  try {
    const { stdout } = await execQuick('git status --short');
    return stdout.toString() === '';
  } catch (e) {
    return true;
  }
};
