import { TemplateFunction } from '../../types';

const TemplateFn: TemplateFunction = function () {
  return {
    filename: '.gitignore',
    contents: `# dist things
/lib
/es
/artifacts
`,
  };
};

export default TemplateFn;
