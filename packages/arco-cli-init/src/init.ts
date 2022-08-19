import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import axios from 'axios';
import inquirer from 'inquirer';
import { initConfig } from 'arco-cli-config';
import {
  print,
  confirm,
  isGitStatusClean,
  getGitRootPath,
  getGlobalInfo,
  getAnswerFromUser,
} from 'arco-cli-dev-utils';
import createProjectFromTemplate, { CreateProjectOptions } from 'arco-cli-create-project';

import locale from './locale';

interface ProjectInitOptions {
  /* Project name */
  projectName: string;
  /* Path of template */
  template?: string;
  /* Filename of material meta */
  metaFileName?: string;
  /* Filename for arco-cli config */
  configFileName?: string;
  /* Whether to add Package in the Lerna project */
  isForMonorepo?: boolean;
  /* Whether to simply create a project (Exclude the logic of materials) */
  isPureProject?: boolean;
}

type InfoCollectedFromUser = {
  ENV_MONOREPO: boolean;
  framework: 'react' | 'vue';
  type: 'component' | 'block' | 'page' | 'library' | 'pro' | 'monorepo';
  arcoProOptions: {
    framework: 'next' | 'vite' | 'cra';
    type: 'simple' | 'full';
  };
  meta: {
    name: string;
    title: string;
    description: string;
    version: string;
    category: string[];
  };
};

// Available templates
// Temporarily change value of template via process.env.TEMPLATE
const TEMPLATE_PACKAGE_NAME = new Proxy(
  {
    core: '@arco-materials/template-core',
    monorepo: '@arco-materials/template-monorepo',
    'pro-react': 'arco-design-pro',
    'pro-vue': 'arco-design-pro-vue',
    'team-site-react': '@arco-materials/template-team-site',
  },
  {
    get: (obj, propName: string) => process.env.TEMPLATE || obj[propName],
  }
);

/**
 * Init project
 */
export default async function ({
  projectName,
  template,
  metaFileName = 'arcoMeta',
  configFileName,
  isForMonorepo = false,
  isPureProject = false,
}: ProjectInitOptions) {
  if (!projectName) {
    print.error(`\n${locale.ERROR_NO_PROJECT_NAME}\n`);
    process.exit(1);
  }

  if (!(await isGitStatusClean())) {
    print.error(`\n${locale.ERROR_GIT_DIRTY}\n`);
    process.exit(1);
  }

  // project init path
  const root = path.resolve(projectName);
  if (
    !(await confirm(
      () => fs.pathExistsSync(root),
      `${locale.WARN_PATH_EXIST} ${chalk.yellow(root)}`
    ))
  ) {
    process.exit(0);
  }

  let createProjectOptions: Pick<
    CreateProjectOptions,
    'template' | 'beforeGitCommit' | 'packageJson' | 'customInitFunctionParams'
  > = {
    template: null,
  };

  if (isPureProject) {
    const { template, name } = await inquirer.prompt([
      {
        type: 'input',
        name: 'template',
        message: locale.TIP_INPUT_TEMPLATE_NAME_FOR_PURE_PROJECT,
        // Template for Arco material team site
        default: TEMPLATE_PACKAGE_NAME['team-site-react'],
      },
      {
        type: 'input',
        name: 'name',
        message: locale.TIP_INPUT_PACKAGE_NAME_FOR_PURE_PROJECT,
      },
    ]);
    createProjectOptions = {
      template,
      packageJson: { name },
    };
  } else {
    const baseInfo: Partial<InfoCollectedFromUser> = {
      ENV_MONOREPO: isForMonorepo,
    };

    // Try to skip select framework if in a monorepo project
    if (isForMonorepo) {
      try {
        const pathGitRoot = getGitRootPath();
        const { dependencies, devDependencies } =
          fs.readJsonSync(path.resolve(pathGitRoot, 'package.json')) || {};
        if ((dependencies && dependencies.react) || (devDependencies && devDependencies.react)) {
          baseInfo.framework = 'react';
        } else if ((dependencies && dependencies.vue) || (devDependencies && devDependencies.vue)) {
          baseInfo.framework = 'vue';
        }
      } catch (error) {}
    }

    // When the user specifies a template, get meta info from package.json
    if (template) {
      try {
        let packageJson = null;
        if (template.startsWith('file:')) {
          packageJson = fs.readJsonSync(`${template.replace(/^file:/, '')}/package.json`);
        } else {
          const hostUnpkg = getGlobalInfo().host.unpkg;
          const { data } = await axios.get(`${hostUnpkg}/${template}/template/package.json`);
          packageJson = data;
        }
        const metaInTemplate = packageJson && packageJson[metaFileName];
        if (metaInTemplate) {
          baseInfo.meta = metaInTemplate;
          baseInfo.type = metaInTemplate.type;
        }
      } catch (e) {}
    }

    const infoFromUser = await getAnswerFromUser({
      command: 'init',
      baseInfo,
    });
    // Material type is something like react-component/vue-component
    const materialType = baseInfo.type || `${infoFromUser.framework}-${infoFromUser.type}`;

    switch (infoFromUser.type) {
      case 'monorepo': {
        createProjectOptions = {
          template: TEMPLATE_PACKAGE_NAME.monorepo,
          customInitFunctionParams: {
            type: materialType,
          },
        };
        break;
      }

      case 'pro': {
        createProjectOptions = {
          template: TEMPLATE_PACKAGE_NAME[`pro-${infoFromUser.framework}`],
          beforeGitCommit: () => null,
          customInitFunctionParams: {
            framework: infoFromUser.arcoProOptions.framework,
            simple: infoFromUser.arcoProOptions.type === 'simple',
          },
        };
        break;
      }

      default: {
        const { name, version, description, ...rest } = infoFromUser.meta;
        createProjectOptions = {
          template: TEMPLATE_PACKAGE_NAME.core,
          packageJson: {
            name,
            version,
            description,
            [metaFileName]: {
              type: materialType,
              ...rest,
            },
          },
          customInitFunctionParams: {
            isForMonorepo,
            type: materialType,
            packageName: name,
          },
        };
        break;
      }
    }
  }

  if (template) {
    createProjectOptions.template = template;
  }

  return createProjectFromTemplate({
    root,
    projectName,
    isForMonorepo,
    beforeGitCommit: () => {
      // Create arco.config.js
      if (!isPureProject && !isForMonorepo) {
        initConfig(configFileName);
      }
    },
    ...createProjectOptions,
  }).catch((err) => {
    print.error(err);
    throw err;
  });
}
