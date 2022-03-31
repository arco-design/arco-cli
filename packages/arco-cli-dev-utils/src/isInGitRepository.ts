import execQuick from './execQuick';

export default async () => {
  const { code, stdout } = await execQuick('git rev-parse --is-inside-work-tree');
  return code === 0 && /^true/i.test(stdout);
};
