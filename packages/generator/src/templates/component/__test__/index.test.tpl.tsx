import { TemplateFunction } from '../../../types';

const templateFn: TemplateFunction = function ({ name: componentName }) {
  return {
    filename: 'index.test.tsx',
    contents: `/* eslint-disable import/no-extraneous-dependencies */
import React from 'react';
import { render } from '@testing-library/react';
import { ${componentName} } from '../index';

describe('${componentName}', () => {
  it('render current content', () => {
    render(<${componentName} />);
    expect(document.querySelector('div')).toHaveTextContent('Edit this component');
  });
});
`,
  };
};

export default templateFn;
