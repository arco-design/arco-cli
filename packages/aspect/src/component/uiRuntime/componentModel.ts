export type ComponentServer = {
  env: string;
  url: string;
};

export type ComponentOutline = {
  text: string;
  depth: number;
};

export type ComponentExtraDoc = {
  title: string;
  content: string;
  type?: 'md';
};

export type ComponentExtraStyle = {
  title: string;
  href: string;
};

export type ComponentModelProps = {
  id: string;
  name: string;
  packageName: string;
  version: string;
  author?: string;
  description?: string;
  labels?: string[];
  host?: string;
  server?: ComponentServer;
  outline?: ComponentOutline[];
  extraDocs?: ComponentExtraDoc[];
  extraStyles?: ComponentExtraStyle[];
};

export class ComponentModel {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly packageName: string,
    readonly version: string,
    readonly author: string,
    readonly host: string,
    readonly server: ComponentServer | undefined,
    readonly description = '',
    readonly labels: string[] = [],
    readonly outline: ComponentOutline[] = [],
    readonly extraDocs: ComponentExtraDoc[] = [],
    readonly extraStyles: ComponentExtraStyle[] = []
  ) {}

  static from({
    id,
    name,
    packageName,
    version,
    author,
    host,
    server,
    description,
    labels,
    outline,
    extraDocs,
    extraStyles,
  }: ComponentModelProps) {
    return new ComponentModel(
      id,
      name,
      packageName,
      version,
      author,
      host,
      server,
      description,
      labels,
      outline,
      extraDocs,
      extraStyles
    );
  }

  static fromArray(componentsProps: ComponentModelProps[]) {
    return componentsProps.map((rawComponent) => ComponentModel.from(rawComponent));
  }

  static empty() {
    return new ComponentModel('', '', '', '', '', '', { env: '', url: '' });
  }
}
