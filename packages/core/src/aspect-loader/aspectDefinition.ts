export type AspectDefinitionProps = {
  id?: string;
  aspectPath: string;
  runtimePath: string | null;
};

export class AspectDefinition {
  constructor(
    /**
     * path to the root directory of the aspect module
     */
    readonly aspectPath: string,

    /**
     * path to the runtime entry
     */
    readonly runtimePath: string | null,

    /**
     * id of the component (used instead of component in the case of core aspect)
     */
    readonly id?: string,
    /**
     * aspect defined using 'file://' protocol
     */
    readonly local?: boolean
  ) {}

  static from({ aspectPath, runtimePath, id }: AspectDefinitionProps) {
    return new AspectDefinition(aspectPath, runtimePath, id);
  }
}
