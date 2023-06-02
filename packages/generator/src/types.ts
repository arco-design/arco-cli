export type GeneratorContext = {
  path: string;
  name: string;
  version: string;
  description: string;
};

export type TemplateFunction = (
  context: GeneratorContext
) => string | { filename: string; contents: string };

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
