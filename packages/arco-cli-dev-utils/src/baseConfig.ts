import axios from 'axios';
import getGlobalInfo from './getGlobalInfo';

export type Locale = 'zh-CN' | 'en-US';

export type Answer = string | number | boolean | string[];

export type FilterPropertyRule = {
  type: 'include' | 'exclude';
  value: string[];
};

export type Filter = {
  ENV_MONOREPO?: boolean;
  type?: FilterPropertyRule;
  framework?: FilterPropertyRule;
  version?: string;
};

export type Message = string | Record<Locale, string>;

export type CliQuestion = {
  type: 'list' | 'input' | 'checkbox';
  message: Message;
  default?: Answer;
  choices?: Array<{
    label: Message;
    value: Answer;
    _filter?: Filter;
    _labelAsValue?: boolean;
  }>;
  validate?: {
    rule: 'required';
    message: Message;
  };
  // Only used for list/checkbox, user can input value by self
  allowCreate?: boolean;
};

export type QNode = {
  _key: string;
  _filter?: Filter;
  _question: CliQuestion | QNode[];
};

export type CliBaseConfig = { question: Record<string, QNode[]>; global: Record<string, any> };

const DEFAULT_CONFIG: CliBaseConfig = {
  question: {
    init: [
      {
        _key: 'framework',
        _question: {
          type: 'list',
          message: {
            'zh-CN': '请选择你希望使用的技术栈',
            'en-US': 'Please select the framework you want to use',
          },
          choices: [
            {
              label: 'React',
              value: 'react',
            },
            {
              label: 'Vue',
              value: 'vue',
            },
          ],
        },
      },
      {
        _key: 'type',
        _question: {
          type: 'list',
          message: {
            'zh-CN': '请选择所要创建项目的类型',
            'en-US': 'Please select the type of project you want to create',
          },
          choices: [
            {
              label: {
                'zh-CN': '业务组件',
                'en-US': 'Component',
              },
              value: 'component',
            },
            {
              _filter: {
                framework: {
                  type: 'include',
                  value: ['react'],
                },
              },
              label: {
                'zh-CN': '区块',
                'en-US': 'Block',
              },
              value: 'block',
            },
            {
              _filter: {
                framework: {
                  type: 'include',
                  value: ['react'],
                },
              },
              label: {
                'zh-CN': '页面',
                'en-US': 'Page',
              },
              value: 'page',
            },
            {
              label: {
                'zh-CN': '组件库',
                'en-US': 'Library',
              },
              value: 'library',
            },
            {
              _filter: {
                framework: {
                  type: 'include',
                  value: ['react'],
                },
              },
              label: {
                'zh-CN': '工具库',
                'en-US': 'Utils',
              },
              value: 'utils',
            },
            {
              _filter: {
                ENV_MONOREPO: false,
              },
              label: {
                'zh-CN': 'Lerna Monorepo 项目',
                'en-US': 'Lerna Monorepo Project',
              },
              value: 'monorepo',
            },
            {
              _filter: {
                ENV_MONOREPO: false,
              },
              label: {
                'zh-CN': 'Arco Pro 项目',
                'en-US': 'Arco Pro Project',
              },
              value: 'pro',
            },
          ],
        },
      },
      {
        _filter: {
          type: {
            type: 'include',
            value: ['pro'],
          },
        },
        _key: 'arcoProOptions',
        _question: [
          {
            _key: 'framework',
            _question: {
              type: 'list',
              message: {
                'zh-CN': '请选择你想要使用的开发框架',
                'en-US': 'Please select the framework you want to use',
              },
              choices: [
                {
                  _filter: {
                    framework: {
                      type: 'include',
                      value: ['react'],
                    },
                  },
                  label: 'Next (https://nextjs.org/)',
                  value: 'next',
                },
                {
                  label: 'Vite (https://vitejs.dev/)',
                  value: 'vite',
                },
                {
                  _filter: {
                    framework: {
                      type: 'include',
                      value: ['react'],
                    },
                  },
                  label: 'Create React App (https://create-react-app.dev)',
                  value: 'cra',
                },
              ],
            },
          },
          {
            _key: 'type',
            _question: {
              type: 'list',
              message: {
                'zh-CN': '请选择 Arco Pro 模板',
                'en-US': 'Please choose the template of Arco Pro',
              },
              choices: [
                {
                  label: {
                    'zh-CN': '简单版（只包含一个基础页面）',
                    'en-US': 'Simple version (contains only one basic page)',
                  },
                  value: 'simple',
                },
                {
                  label: {
                    'zh-CN': '完整版（包含所有页面）',
                    'en-US': 'Full version (contains all pages)',
                  },
                  value: 'full',
                },
              ],
            },
          },
        ],
      },
      {
        _filter: {
          type: {
            type: 'exclude',
            value: ['pro', 'monorepo'],
          },
        },
        _key: 'meta',
        _question: [
          {
            _key: 'name',
            _question: {
              type: 'input',
              message: {
                'zh-CN': '请输入 NPM 包名',
                'en-US': 'Please enter the NPM package name',
              },
              validate: {
                rule: 'required',
                message: {
                  'zh-CN': 'NPM 包名为必填项',
                  'en-US': 'NPM package name is necessary',
                },
              },
            },
          },
          {
            _key: 'title',
            _question: {
              type: 'input',
              message: {
                'zh-CN': '请输入物料标题',
                'en-US': 'Please enter the material title',
              },
              validate: {
                rule: 'required',
                message: {
                  'zh-CN': '物料标题为必填项',
                  'en-US': 'Material title is necessary',
                },
              },
            },
          },
          {
            _key: 'description',
            _question: {
              type: 'input',
              message: {
                'zh-CN': '请描述你的物料',
                'en-US': 'Please describe your material',
              },
            },
          },
          {
            _key: 'version',
            _question: {
              type: 'input',
              message: {
                'zh-CN': '请输入 NPM 包版本号',
                'en-US': 'Please enter the NPM package version',
              },
              default: '0.1.0',
            },
          },
          {
            _key: 'category',
            _question: {
              allowCreate: true,
              type: 'checkbox',
              message: {
                'zh-CN': '请选择物料的关键词（可多选）',
                'en-US': 'Please select the keywords of material (multiple choices)',
              },
              choices: [
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '数据展示',
                    'en-US': 'Data Display',
                  },
                  value: '数据展示',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '信息展示',
                    'en-US': 'Info Display',
                  },
                  value: '信息展示',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '表格',
                    'en-US': 'Table',
                  },
                  value: '表格',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '表单',
                    'en-US': 'Form',
                  },
                  value: '表单',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '筛选',
                    'en-US': 'Filter',
                  },
                  value: '筛选',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '弹出框',
                    'en-US': 'Modal',
                  },
                  value: '弹出框',
                },
                {
                  _labelAsValue: true,
                  label: {
                    'zh-CN': '编辑器',
                    'en-US': 'Editor',
                  },
                  value: '编辑器',
                },
              ],
            },
          },
        ],
      },
    ],
  },
  global: {},
};

export async function getBaseConfig() {
  if (process.env.BASE_CONFIG !== 'local') {
    const { group, host } = getGlobalInfo();
    try {
      const {
        data: { result: config },
      } = await axios.get(`${host.arco}/material/api/cliConfig${group ? `?group=${group}` : ''}`);
      return config;
    } catch (e) {}
  }

  return DEFAULT_CONFIG;
}
