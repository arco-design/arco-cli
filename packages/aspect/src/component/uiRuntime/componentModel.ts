export type ComponentServer = {
  env: string;
  url: string;
};

export type ComponentOutline = {
  text: string;
  depth: number;
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
    readonly outline: ComponentOutline[] = []
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
      outline
    );
  }

  static fromArray(componentsProps: ComponentModelProps[]) {
    return componentsProps.map((rawComponent) => ComponentModel.from(rawComponent));
  }

  static empty() {
    return new ComponentModel('', '', '', '', '', { env: '', url: '' });
  }
}
