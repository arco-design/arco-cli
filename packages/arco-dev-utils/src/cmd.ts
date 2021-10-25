import { spawn } from 'child_process';
import print from './print';

export async function execQuick(
  command: string,
  cwd: string = process.cwd(),
  options = {
    time: false,
    display: false,
  }
) {
  return new Promise((resolve, reject) => {
    const begin = new Date().getTime();
    const stdout = [];
    const task = spawn(command, [], {
      shell: true,
      cwd,
    });

    task.stdout.on('end', () => {
      const end = new Date().getTime();
      const waste = ((end - begin) / 1000).toFixed(2);
      if (options.time) {
        print.info(command, `Executed in ${waste} ms.`);
      }
      resolve({
        pid: task.pid,
        stdout,
      });
    });

    task.stdout.on('data', (data) => {
      const dataStr = data.toString('utf-8');
      if (options.display) {
        print(dataStr);
      }
      stdout.push(dataStr);
    });

    task.stdout.on('error', (err) => {
      print.error(command, 'Executed failed');
      console.error(err);
      reject(err);
    });
  });
}
