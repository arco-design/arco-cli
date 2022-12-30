export type Method = {
  name: string;
  description: string;
  args: [];
  access: 'public' | 'private' | '';
  returns: Record<string, any>;
  modifiers: [];
};

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
  description: string;
  args?: Record<string, any>[];
  returns?: Record<string, any>;
  access?: string;
  methods?: Method[];
  properties?: DocProp[];
  static?: boolean;
};
