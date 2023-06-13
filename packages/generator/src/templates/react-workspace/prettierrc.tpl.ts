import { TemplateFunction } from '../../types';

const TemplateFn: TemplateFunction = function () {
  const config = {
    arrowParens: 'always',
    jsxBracketSameLine: false,
    jsxSingleQuote: false,
    printWidth: 100,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'es5',
    useTabs: false,
  };
  return {
    filename: '.prettierrc',
    contents: JSON.stringify(config, null, 2),
  };
};

export default TemplateFn;
