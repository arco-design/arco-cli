export type TemplateType = 'workspace' | 'component' | 'package';

export type GenerateOptions = {
  path?: string;
  packageName?: string;
  version?: string;
  description?: string;
  template?: string;
  templateArgs?: string;
};

export type GeneratorContext = {
  path: string;
  name: string;
  packageName: string;
  templateArgs: Record<string, any>;
  version: string;
  description: string;
};

export type ComponentExports = {
  path: string;
  modules: Array<{ name: string; type?: boolean }>;
};

export type TemplateFunction = (
  context: GeneratorContext
) => false | { filename: string; contents: string; exports?: ComponentExports['modules'] };

export type TemplateDirectoryDescriptionFunction = (context: GeneratorContext) => {
  ignore: boolean;
};

export type TemplateManifest = {
  type?: TemplateType;
  // same with ComponentConfig.entries
  entries?: {
    main?: string;
    style?: string;
    preview?: string;
    jsdoc?: string | string[];
    extraDocs?: Array<{ title: string; entry: string }>;
  };
};
