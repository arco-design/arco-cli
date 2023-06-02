import execQuick from './execQuick';

export async function installDependencies(workspacePath: string) {
  let command = 'npm';
  let args = ['install'];

  // try yarn
  try {
    const { stdout } = await execQuick('yarn -v');
    if (stdout.match(/^\d+\.\d+/)) {
      command = 'yarn';
      args = [];
    }
  } catch (e) {}

  // try pnpm
  // try {
  //   const { stdout } = await execQuick('pnpm -v');
  //   if (stdout.match(/^\d+\.\d+/)) {
  //     command = 'pnpm';
  //     args = ['i'];
  //   }
  // } catch (e) {}

  const commandExec = [command].concat(args).join(' ');
  const { code, stderr } = await execQuick(commandExec, { cwd: workspacePath });

  return { code, stderr, command: commandExec };
}
