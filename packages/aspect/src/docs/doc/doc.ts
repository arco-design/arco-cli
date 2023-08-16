import { DocPropList } from './docPropList';
import { SerializableMap } from './docProp';
import { DocOutline, DocSnippet } from '../type';

export class Doc {
  constructor(readonly filePath: string, readonly props: DocPropList) {}

  toObject() {
    return {
      filePath: this.filePath,
      props: this.props.docProps,
    };
  }

  get title(): string {
    const value = this.props.get('title')?.value;
    return (value as string) || '';
  }

  get description(): string {
    const value = this.props.get('description')?.value;
    return (value as string) || '';
  }

  get labels(): string[] {
    const value = this.props.get('labels')?.value;
    return (value as string[]) || [];
  }

  get outline(): DocOutline {
    return this.props.get('outline')?.value as [];
  }

  get snippets(): DocSnippet[] {
    return this.props.get('snippets')?.value as [];
  }

  static from(path: string, propObject: SerializableMap) {
    return new Doc(path, DocPropList.from(propObject));
  }

  static mergeDocProperty(docProp, extendProp): typeof docProp {
    if (Array.isArray(docProp) || Array.isArray(extendProp)) {
      return [
        ...(Array.isArray(docProp) ? docProp : []),
        ...(Array.isArray(extendProp) ? extendProp : []),
      ];
    }

    return extendProp || docProp;
  }
}
