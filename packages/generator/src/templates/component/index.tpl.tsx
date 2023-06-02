import { TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  return {
    filename: 'index.ts',
    contents: `export { ${componentName} } from './${componentName}';
export type { ${componentName}Props } from './interface';
`,
  };
};

export default templateFn;
