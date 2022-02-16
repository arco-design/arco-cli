#!/usr/bin/env node

import program from 'commander';
import { print } from 'arco-cli-dev-utils';
import showConfig from './config/showConfig';
import component from './scripts/build/component';
import docgen from './scripts/docgen';
import buildIcon from './scripts/build/icon';
import { testClient, testNode } from './scripts/test';
import { dev as devSite, build as buildSite } from './scripts/build/site';
import changelog from './scripts/changelog';

const { version } = require('../package.json');

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on('unhandledRejection', (err) => {
  throw err;
});

const subCommandList = [
  'dev:component',
  'build:component',
  'build:component:css',
  'build:component:dist',
  'build:component:es',
  'build:component:cjs',
  'dev:site',
  'build:site',
  'build:icon',
  'docgen',
  'test',
  'test:client',
  'test:node',
  'show:config',
];

program
  .version(version)
  .name('arco-scripts')
  .usage('command [options]')
  .arguments('<cmd>')
  .action((cmd) => {
    if (subCommandList.indexOf(cmd) === -1) {
      print.error('[arco-scripts]', 'Invalid command...');
      program.help();
    }
  });

program
  .command('dev:component')
  .description('build components with watch mode')
  .action(() => {
    component.dev();
  });

program
  .command('build:component')
  .description('build all these sources: es, cjs, dist, icon and css')
  .action(() => {
    component.build();
  });

program.command('build:component:css').action(() => {
  component.buildCSS();
});

program.command('build:component:dist').action(() => {
  component.buildUMD();
});

program.command('build:component:es').action(() => {
  component.buildES();
});

program.command('build:component:cjs').action(() => {
  component.buildCJS();
});

program
  .command('dev:site')
  .description(
    'build your website with watch mode. e.g. arco-scripts dev:site --ip 127.0.0.1 --port 9090'
  )
  .option('--https', 'whether to use https')
  .option('--ip <ip>', 'ip you want to run web server')
  .option('--port <port>', 'port you want to run web server')
  .action(({ https, ip, port }) => {
    devSite(https, ip, port);
  });

program.command('build:site').action(() => {
  buildSite();
});

program.command('build:icon').action(() => {
  buildIcon();
});

program
  .command('docgen')
  .description(
    'generate document of component. e.g. arco-scripts docgen --components Alert,Affix,Button'
  )
  .option('-c, --components [names]', 'component name(s) joined by comma(,)')
  .action(({ components }) => {
    docgen(typeof components === 'string' ? components.split(',') : null);
  });

program
  .command('test')
  .description(
    'A command which contains test:client and test:node, any option you entered will be passed to Jest. e.g. arco-scripts test --updateSnapshot'
  )
  .allowUnknownOption()
  .action(() => {
    testClient();
    testNode();
  });

program
  .command('test:client')
  .description(
    'Any option you entered will be passed to Jest. e.g. arco-scripts test:client --updateSnapshot'
  )
  .allowUnknownOption()
  .action(() => {
    testClient();
  });

program
  .command('test:node')
  .description('Any option you entered will be passed to Jest. e.g. arco-scripts test:node --bail')
  .allowUnknownOption()
  .action(() => {
    testNode();
  });

program
  .command('show:config <configType>')
  .description(
    'Show your current config for arco-scripts. Valid type: babel|style|webpack.component|webpack.site|webpack.icon|jest|docgen'
  )
  .action((type) => {
    showConfig(type);
  });

program
  .command('changelog')
  .description('Generate Changelog from Merge Request.')
  .action(() => {
    changelog();
  });

program.parse(process.argv);
