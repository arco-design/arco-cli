import { DocPropList } from './docPropList';
import { SerializableMap } from './docProp';

export class Doc {
  constructor(readonly filePath: string, readonly props: DocPropList) {}

  toObject() {
    return {
      filePath: this.filePath,
      props: this.props.docProps,
    };
  }

  /**
   * shorthand for getting the component description.
   */
  get description(): string {
    const value = this.props.get('description')?.value;
    if (!value) return '';
    return value as string;
  }

  /**
   * shorthand for getting the component labels.
   */
  get labels(): string[] {
    const value = this.props.get('labels')?.value;
    if (!value) return [];
    return value as any as string[];
  }

  /**
   * shorthand for getting the component outline
   */
  get outline() {
    return this.props.get('outline')?.value;
  }

  static from(path: string, propObject: SerializableMap) {
    return new Doc(path, DocPropList.from(propObject));
  }
}
