import { TemplateFunction } from '../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  return {
    filename: `${componentName}.tsx`,
    contents: `import React from 'react';
import { ${componentName}Props } from './interface';

export function ${componentName}({ style }: ${componentName}Props) {
  return <div style={style}>Edit this component</div>;
}
`,
  };
};

export default templateFn;
