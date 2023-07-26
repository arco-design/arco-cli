/* eslint-disable no-console */
import yargs from 'yargs';
import { Migrator } from './migrator';

function migrate(options: { noEmit: boolean; include: string }) {
  const migrator = new Migrator({
    componentDirPatterns: options.include,
    noEmit: options.noEmit,
  });
  migrator.run();
}

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('arco-migrate')
  .command(
    'migrate',
    'migrate project to arco cli v2',
    (yargs) => {
      return yargs
        .option('noEmit', { type: 'boolean', describe: 'skip writing files' })
        .options('include', {
          type: 'string',
          describe: 'glob patterns to the component directories',
        });
    },
    (options) => migrate(options)
  )
  .help().argv;
