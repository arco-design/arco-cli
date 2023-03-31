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

export type ComponentModelProps = {
  id: string;
  name: string;
  packageName: string;
  version: string;
  description?: string;
  labels?: string[];
  host?: string;
  server?: ComponentServer;
  outline?: ComponentOutline[];
  extraDocs?: ComponentExtraDoc[];
};

export class ComponentModel {
  constructor(
    readonly id: string,
    readonly name: string,
    readonly packageName: string,
    readonly version: string,
    readonly host: string,
    readonly server: ComponentServer | undefined,
    readonly description = '',
    readonly labels: string[] = [],
    readonly outline: ComponentOutline[] = [],
    readonly extraDocs: ComponentExtraDoc[] = []
  ) {}

  static from({
    id,
    name,
    packageName,
    version,
    host,
    server,
    description,
    labels,
    outline,
    extraDocs,
  }: ComponentModelProps) {
    return new ComponentModel(
      id,
      name,
      packageName,
      version,
      host,
      server,
      description,
      labels,
      outline,
      extraDocs
    );
  }

  static fromArray(componentsProps: ComponentModelProps[]) {
    return componentsProps.map((rawComponent) => ComponentModel.from(rawComponent));
  }

  static empty() {
    return new ComponentModel('', '', '', '', '', { env: '', url: '' });
  }
}
