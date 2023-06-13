import { TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  componentName = componentName.replace(/-(.)/g, (_, $1) => $1.toUpperCase());

  return {
    filename: 'index.ts',
    contents: `export { ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './interface';
`,
    exports: [
      {
        name: componentName,
      },
      {
        name: `${componentName}Props`,
        type: true,
      },
    ],
  };
};

export default templateFn;
