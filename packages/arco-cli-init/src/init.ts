import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import axios from 'axios';
import inquirer from 'inquirer';
import { initConfig } from '@arco-design/arco-cli-config';
import {
  print,
  confirm,
  isGitStatusClean,
  CONSTANT,
  getGitRootPath,
  getGlobalInfo,
} from '@arco-design/arco-dev-utils';
import createProjectFromTemplate, {
  CreateProjectOptions,
} from '@arco-design/arco-create-project-from-template';

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

type FrameworkType = 'react' | 'vue';

const { PACKAGE_NAME_ARCO_WEB_REACT_V2, PACKAGE_NAME_ARCO_WEB_VUE_V2 } = CONSTANT;

// Available templates
const MATERIAL_TYPE_MAP = {
  'react-component': {
    name: locale.LABEL_COMPONENT,
    template: '@arco-design/arco-template-react-component',
  },
  'react-block': {
    name: locale.LABEL_BLOCK,
    template: '@arco-design/arco-template-react-block',
  },
  'react-page': {
    name: locale.LABEL_PAGE,
    template: '@arco-design/arco-template-react-page',
  },
  'react-library': {
    name: locale.LABEL_LIBRARY,
    template: '@arco-design/arco-template-react-library',
  },
  'react-monorepo': {
    name: locale.LABEL_MONOREPO,
    template: '@arco-design/arco-template-react-monorepo',
  },
  'vue-component': {
    name: locale.LABEL_COMPONENT,
    template: '@arco-design/arco-template-vue-component',
  },
  'vue-monorepo': {
    name: locale.LABEL_MONOREPO,
    template: '@arco-design/arco-template-vue-monorepo',
  },
  'arco-design-pro': {
    name: locale.LABEL_ARCO_PRO,
    template: '@arco-design/arco-template-arco-design-pro',
    templateSimple: '@arco-design/arco-template-arco-design-pro-simple',
  },
};

const TYPES_MATERIAL = ['react-component', 'react-block', 'react-page'];

const TYPES_FOR_REACT = [
  'react-component',
  'react-block',
  'react-page',
  'react-library',
  'react-monorepo',
  'arco-design-pro',
];

const TYPES_FOR_VUE = ['vue-component', 'vue-monorepo'];

// Templates for Monorepo
const VALID_TYPES_IN_MONOREPO = [
  'react-component',
  'react-block',
  'react-page',
  'react-library',
  'vue-component',
];

const CATEGORIES_COMPONENT = [
  '数据展示',
  '信息展示',
  '表格',
  '表单',
  '筛选',
  '弹出框',
  '编辑器',
  '其他',
];
const CATEGORIES_BLOCK = [
  '基础模版',
  '官网模版',
  '注册登陆',
  '数据展示',
  '信息展示',
  '表格',
  '表单',
  '筛选',
  '弹出框',
  '编辑器',
  '可视化',
  '其他',
];
const CATEGORIES_PAGE = CATEGORIES_BLOCK;

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
    process.exit(0);
  }

  if (!isGitStatusClean()) {
    print.error(`\n${locale.ERROR_GIT_DIRTY}\n`);
    process.exit(0);
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

  const getCreateProjectOptions = async (): Promise<Partial<CreateProjectOptions>> => {
    // Create a pure project
    if (isPureProject) {
      return getPureProjectConfig();
    }

    // When the user specifies a template
    if (template) {
      let metaInTemplate: { [key: string]: any } = {};

      try {
        let packageJson = null;

        if (template.startsWith('file:')) {
          packageJson = fs.readJsonSync(`${template.replace(/^file:/, '')}/package.json`);
        } else {
          const hostUnpkg = getGlobalInfo().host.unpkg;
          const { data } = await axios.get(`${hostUnpkg}/${template}/template/package.json`);
          packageJson = data;
        }

        metaInTemplate = packageJson && packageJson[metaFileName];
      } catch (e) {}

      let materialType = metaInTemplate?.type;
      if (!materialType) {
        materialType = await inquiryMaterialType({
          template,
          isForMonorepo,
        });
      }

      return getComponentConfig({
        type: materialType,
        template,
        metaFileName,
        meta: metaInTemplate,
      });
    }

    const framework = await inquiryFramework(isForMonorepo);
    const materialType = await inquiryMaterialType({
      framework,
      template,
      isForMonorepo,
    });

    switch (materialType) {
      case 'arco-design-pro':
        return getArcoDesignProConfig();

      case 'react-monorepo':
        return {
          template: MATERIAL_TYPE_MAP['react-monorepo'].template,
        };

      case 'vue-monorepo':
        return {
          template: MATERIAL_TYPE_MAP['vue-monorepo'].template,
        };

      default:
        return getComponentConfig({
          type: materialType,
          template,
          metaFileName,
          framework,
        });
    }
  };

  const extraOptions = await getCreateProjectOptions();

  return createProjectFromTemplate({
    root,
    template,
    projectName,
    isForMonorepo,
    beforeGitCommit: () => {
      // Create arco.config.js
      if (!isPureProject && !isForMonorepo) {
        initConfig(configFileName);
      }
    },
    ...extraOptions,
  }).catch((err) => {
    print.error(err);
    throw err;
  });
}

/**
 * Ask the type of material to be created
 */
async function inquiryMaterialType({
  framework = 'react',
  template,
  isForMonorepo,
}: {
  framework?: FrameworkType;
  template: string;
  isForMonorepo: boolean;
}): Promise<string> {
  print.info(`\n${locale.TIP_INFO_ABOUT_TEMPLATE}\n`);

  const { type } = await inquirer.prompt([
    {
      type: 'list',
      name: 'type',
      message: template ? locale.TIP_SELECT_TYPE_OF_MATERIAL : locale.TIP_SELECT_TYPE_OF_PROJECT,
      choices: Object.entries(MATERIAL_TYPE_MAP)
        .filter(([key]) => {
          if (template) {
            return TYPES_MATERIAL.indexOf(key) > -1;
          }

          return (
            (framework === 'react' && TYPES_FOR_REACT.indexOf(key) > -1) ||
            (framework === 'vue' && TYPES_FOR_VUE.indexOf(key) > -1)
          );
        })
        .filter(([key]) => !isForMonorepo || VALID_TYPES_IN_MONOREPO.indexOf(key) !== -1)
        .map(([key, { name }]) => ({ name, value: key })),
    },
  ]);
  return type;
}

/**
 * Ask the meta information of the material
 */
async function inquiryMaterialMeta(meta: { [key: string]: any }): Promise<{
  name: string;
  title: string;
  description: string;
  version: string;
  category?: string[];
}> {
  let pkgNamePrefix = 'rc';
  let categories = [];

  switch (meta.type) {
    case 'vue-component':
      pkgNamePrefix = 'vc';
      categories = CATEGORIES_COMPONENT;
      break;
    case 'react-component':
      pkgNamePrefix = 'rc';
      categories = CATEGORIES_COMPONENT;
      break;
    case 'react-block':
      pkgNamePrefix = 'rb';
      categories = CATEGORIES_PAGE;
      break;
    case 'react-page':
      pkgNamePrefix = 'rp';
      break;
    default:
      break;
  }

  return inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: locale.TIP_INPUT_PACKAGE_NAME,
      default: meta.name || `@arco-design/${pkgNamePrefix}-xxx`,
    },
    {
      type: 'input',
      name: 'title',
      message: locale.TIP_INPUT_TITLE,
      default: meta.title || '',
    },
    {
      type: 'input',
      name: 'description',
      message: locale.TIP_INPUT_DESCRIPTION,
      default: meta.description || '',
    },
    {
      type: 'input',
      name: 'version',
      message: locale.TIP_INPUT_VERSION,
      default: '0.1.0',
    },
    {
      type: 'checkbox',
      name: `category`,
      message: locale.TIP_SELECT_CATEGORY,
      choices: categories,
      default: meta.category || categories[categories.length - 1],
      when: () => categories.length,
    },
  ]);
}

/**
 * Ask framework
 */
async function inquiryFramework(isForMonorepo?: boolean): Promise<FrameworkType> {
  let framework: FrameworkType = null;

  // Try to get the framework dependencies of the current warehouse
  if (isForMonorepo) {
    try {
      const pathGitRoot = getGitRootPath();
      const { dependencies, devDependencies } =
        fs.readJsonSync(path.resolve(pathGitRoot, 'package.json')) || {};
      if ((dependencies && dependencies.react) || (devDependencies && devDependencies.react)) {
        framework = 'react';
      } else if ((dependencies && dependencies.vue) || (devDependencies && devDependencies.vue)) {
        framework = 'vue';
      }
    } catch (error) {}
  }

  if (!framework) {
    const answer = await inquirer.prompt({
      type: 'list',
      name: 'framework',
      message: locale.TIP_SELECT_FRAMEWORK,
      choices: ['React', 'Vue'],
    });
    framework = answer.framework.toLowerCase();
  }

  return framework;
}

/**
 * Get the template to create Arco Pro
 */
async function getArcoDesignProConfig(): Promise<Partial<CreateProjectOptions>> {
  // Config for Arco Pro
  const question = [
    {
      type: 'list',
      name: 'type',
      message: locale.TIP_SELECT_ARCO_PRO_TYPE,
      choices: [
        {
          name: locale.DES_ARCO_PRO_COMPLETE,
          value: 'complete',
        },
        {
          name: locale.DES_ARCO_PRO_SIMPLE,
          value: 'simple',
        },
      ],
      default: 'complete',
    },
  ];

  const answer = await inquirer.prompt(question);
  const template =
    answer.type === 'complete'
      ? MATERIAL_TYPE_MAP['arco-design-pro'].template
      : MATERIAL_TYPE_MAP['arco-design-pro'].templateSimple;

  return {
    template,
    arcoPackageName: PACKAGE_NAME_ARCO_WEB_REACT_V2,
  };
}

/**
 * Get template, Arco version, packageJson information needed to create the project
 */
async function getComponentConfig({
  type,
  template = MATERIAL_TYPE_MAP[type].template,
  metaFileName,
  meta,
  framework,
}: {
  /** Material type */
  type: string;
  /** User-specified template parameter */
  template?: string;
  /** Filename for meta */
  metaFileName: string;
  /** Meta info for material */
  meta?: { [key: string]: any };
  /** Frontend framework type */
  framework?: FrameworkType;
}): Promise<Partial<CreateProjectOptions>> {
  meta = meta || {};
  meta.type = type;

  let arcoPackageName = '';
  switch (framework) {
    case 'react':
      arcoPackageName = PACKAGE_NAME_ARCO_WEB_REACT_V2;
      break;
    case 'vue':
      arcoPackageName = PACKAGE_NAME_ARCO_WEB_VUE_V2;
      break;
    default:
      break;
  }

  const answer = await inquiryMaterialMeta(meta);
  const packageInfo = {
    name: answer.name,
    version: answer.version,
    description: answer.description,
    [metaFileName]: {
      ...meta,
      title: answer.title,
      category: [...new Set((answer.category || []).concat(meta.category || []))],
    },
  };

  return {
    template,
    arcoPackageName,
    packageJson: packageInfo,
  };
}

/**
 * Get the parameters needed to create non-material items
 */
async function getPureProjectConfig(): Promise<Partial<CreateProjectOptions>> {
  const { template, name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'template',
      message: locale.TIP_INPUT_TEMPLATE_NAME_FOR_PURE_PROJECT,
      // Template for Arco material team site
      default: '@arco-design/arco-template-team-site',
    },
    {
      type: 'input',
      name: 'name',
      message: locale.TIP_INPUT_PACKNAGE_NAME_FOR_PURE_PROJECT,
    },
  ]);

  return {
    template,
    packageJson: { name },
  };
}
