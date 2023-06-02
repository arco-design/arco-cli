import { TemplateFunction } from '../../types';

const TemplateFn: TemplateFunction = function () {
  const config = {
    extends: ['stylelint-config-standard', 'stylelint-config-css-modules'],
    customSyntax: 'postcss-less',
    rules: {
      'block-opening-brace-space-before': 'always',
      'declaration-block-no-duplicate-properties': null,
      'declaration-block-trailing-semicolon': null,
      'font-family-no-missing-generic-family-keyword': null,
      'no-descending-specificity': null,
      'no-duplicate-selectors': null,
      'selector-anb-no-unmatchable': null,
    },
  };
  return {
    filename: '.stylelintrc',
    contents: JSON.stringify(config, null, 2),
  };
};

export default TemplateFn;
