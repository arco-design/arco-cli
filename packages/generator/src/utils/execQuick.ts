/* eslint-disable no-console */
import chalk from 'chalk';
import { spawn } from 'child_process';

function consoleInfo(text: string) {
  console.log(chalk.white(text));
}

function consoleError(text: string) {
  console.log(chalk.red(text));
}

export default async function execQuick(
  command: string,
  options: {
    cwd?: string;
    time?: boolean;
    silent?: boolean;
  } = {}
): Promise<{ pid: number; code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const silent = options.silent !== false;
    const begin = new Date().getTime();
    const result = {
      pid: null,
      code: null,
      stdout: '',
      stderr: '',
    };

    const { stdout, stderr, pid } = spawn(command, [], {
      shell: true,
      cwd: options.cwd,
    }).on('close', (code) => {
      if (options.time) {
        const end = new Date().getTime();
        const waste = ((end - begin) / 1000).toFixed(2);
        consoleInfo(`execQuick: command [${command}] executed in ${waste} ms.`);
      }

      if (code !== 0 && !silent) {
        consoleError(`execQuick: command [${command}] executed failed`);
      }

      result.code = code;
      resolve(result);
    });

    result.pid = pid;

    stdout.on('data', (data) => {
      const dataStr = data.toString();
      if (!silent) {
        consoleInfo(dataStr);
      }
      result.stdout += dataStr;
    });

    stderr.on('data', (data) => {
      const dataStr = data.toString();
      if (!silent) {
        consoleError(dataStr);
      }
      result.stderr += dataStr;
    });
  });
}
