import { TemplateFunction } from '../../types';

const TemplateFn: TemplateFunction = function () {
  return {
    filename: '.eslintignore',
    contents: `**/node_modules/**
*.json
es
lib
artifacts
`,
  };
};

export default TemplateFn;
