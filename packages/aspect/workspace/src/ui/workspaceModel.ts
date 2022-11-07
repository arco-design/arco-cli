import { ComponentModel, ComponentModelProps } from '@arco-cli/component/dist/ui';

export type WorkspaceProps = {
  name: string;
  path: string;
  components: ComponentModelProps[];
};

export class WorkspaceModel {
  constructor(
    /**
     * name of the workspace.
     */
    readonly name: string,

    /**
     * absolute path of the workspace.
     */
    readonly path: string,

    /**
     * components container in the workspace.
     */
    readonly components: ComponentModel[]
  ) {}

  /**
   * return a component from the workspace.
   */
  getComponent(id: string) {
    return this.components.find((component) => component.id === id);
  }

  static from({ name, path, components }: WorkspaceProps) {
    return new WorkspaceModel(
      name,
      path,
      components.map((value) => {
        return ComponentModel.from(value);
      })
    );
  }

  static empty() {
    return new WorkspaceModel('', '', []);
  }
}
