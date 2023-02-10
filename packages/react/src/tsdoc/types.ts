export type DocProp = {
  name: string;
  description: string;
  required: boolean;
  type: string;
  defaultValue?: string;
  version?: string;
};

export type Doclet = {
  filePath: string;
  name: string;
  description?: string;
  type?: string;
  args?: Record<string, any>[];
  returns?: Record<string, any>;
  properties?: DocProp[];
};
