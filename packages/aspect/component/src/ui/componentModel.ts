export type ComponentServer = {
  env: string;
  url: string;
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
    readonly labels: string[] = []
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
  }: ComponentModelProps) {
    return new ComponentModel(id, name, packageName, version, host, server, description, labels);
  }

  static fromArray(componentsProps: ComponentModelProps[]) {
    return componentsProps.map((rawComponent) => ComponentModel.from(rawComponent));
  }

  static empty() {
    return new ComponentModel('', '', '', '', '', { env: '', url: '' });
  }
}
