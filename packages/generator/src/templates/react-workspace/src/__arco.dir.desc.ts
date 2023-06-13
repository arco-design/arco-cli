import { TemplateDirectoryDescriptionFunction, GeneratorContext } from '../../../types';

const filter: TemplateDirectoryDescriptionFunction = (context: GeneratorContext) => {
  return {
    ignore: context.templateArgs.monorepo,
  };
};

export default filter;
