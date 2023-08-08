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
      const includeExample = '"packages/*/src" "components/*"';
      return yargs
        .option('noEmit', { type: 'boolean', describe: 'skip writing files' })
        .options('include', {
          type: 'string',
          demandOption: `option [include] is required, pass the glob pattern of component directories that need to be migrated. e.g. ${includeExample}`,
          describe: `glob patterns to the component directories, e.g. ${includeExample}`,
        });
    },
    (options) => migrate(options)
  )
  .help().argv;
