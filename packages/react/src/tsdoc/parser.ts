import { generate, Project } from 'ts-document';
import {
  InterfaceSchema,
  FunctionSchema,
  NestedTypeSchema,
  TagType,
  PropertyType,
} from 'ts-document/lib/interface';
import logger from '@arco-cli/legacy/dist/logger';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';

import { Doclet, DocProp } from './types';

/**
 * get doc-prop for preview from parsed ts-property
 */
function getDocProp({ name, type, isOptional, tags }: PropertyType): DocProp {
  const findDescription = (tags: TagType[]): string => {
    return tags.find(({ name }) => name === 'en' || name === 'zh')?.value || '';
  };
  const findDefault = (tags: TagType[]): string => {
    return tags.find(({ name }) => name === 'defaultValue')?.value;
  };
  const findVersion = (tags: TagType[]): string => {
    return tags.find(({ name }) => name === 'version')?.value;
  };

  return {
    name,
    type,
    required: !isOptional,
    description: findDescription(tags),
    defaultValue: findDefault(tags),
    version: findVersion(tags),
  };
}

export function parser(file: SourceFile): Doclet[] {
  const filePath = file.relative;
  let doclets: Doclet[] = [];

  try {
    const componentsInfo = generate(file.path, {
      sourceFilesPaths: [file.path],
      escapeChars: false,
      strictDeclarationOrder: true,
      project: new Project({
        compilerOptions: {
          jsx: 'react' as any,
        },
      }),
    });

    // componentInfo will be an Array when strictDeclarationOrder is true
    if (Array.isArray(componentsInfo)) {
      doclets = componentsInfo.map(({ title, schema }) => {
        let properties = [];
        let type = null;

        if (typeof (schema as NestedTypeSchema).data === 'string') {
          type = (schema as NestedTypeSchema).data;
        } else if (Array.isArray((schema as InterfaceSchema).data)) {
          properties = (schema as InterfaceSchema).data.map(getDocProp);
        } else if (Array.isArray((schema as FunctionSchema).params)) {
          properties = (schema as FunctionSchema).params.map((parsedProp) => {
            const docProp = getDocProp(parsedProp);
            if (parsedProp.initializerText) {
              docProp.description = parsedProp.initializerText;
            }
            return docProp;
          });
        }

        return {
          filePath,
          name: title,
          type,
          properties,
        };
      });
    }
  } catch (err) {
    logger.trace(`failed parsing docs using docgen on path ${filePath} with error`, err);
  }

  return doclets;
}
