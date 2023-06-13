import { TemplateFunction } from '../../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  componentName = componentName.replace(/-(.)/g, (_, $1) => $1.toUpperCase());

  return {
    filename: 'basic.tsx',
    contents: `import React from 'react';
import { ${componentName} } from '..';

export default function Basic() {
  return <${componentName} />;
}
`,
  };
};

export default templateFn;
