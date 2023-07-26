import { GeneratorContext, TemplateFunction } from '../../types';

const templateFn: TemplateFunction = ({ templateArgs }: GeneratorContext) => {
  const isMonorepo = templateArgs?.monorepo;
  const config = {
    'arco.aspect/workspace': {
      components: {
        extends: {
          rootDir: 'src',
          entries: {
            base: './',
            main: 'index.ts',
            style: 'style/index.ts',
            preview: '__docs__/index.mdx',
            jsdoc: ['interface.ts'],
          },
        },
        members: [],
      },
    },
    'arco.service/generator': {
      ...(isMonorepo ? {} : { defaultPath: 'src' }),
      hooks: {
        afterComponentCreated: './.scripts/workspaceHooks/afterComponentCreated.js',
      },
    },
  };

  return {
    filename: 'arco.workspace.jsonc',
    contents: JSON.stringify(config, null, 2),
  };
};

export default templateFn;
