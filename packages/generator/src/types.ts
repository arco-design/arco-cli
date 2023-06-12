export type GeneratorContext = {
  path: string;
  name: string;
  version: string;
  description: string;
};

export type ComponentExports = {
  path: string;
  modules: Array<{ name: string; type?: boolean }>;
};

export type TemplateFunction = (
  context: GeneratorContext
) => string | { filename: string; contents: string; exports?: ComponentExports['modules'] };

export type TemplateManifest = {
  // same with ComponentConfig.entries
  entries: {
    main?: string;
    style?: string;
    preview?: string;
    jsdoc?: string | string[];
    extraDocs?: Array<{ title: string; entry: string }>;
  };
};
