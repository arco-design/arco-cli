import { generate, Project } from 'ts-document';
import type { GenerateConfig } from 'ts-document/lib/interface';
import {
  InterfaceSchema,
  FunctionSchema,
  NestedTypeSchema,
  TagType,
  PropertyType,
} from 'ts-document/lib/interface';
import logger from '@arco-cli/legacy/dist/logger';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';
import type { Doclet, APIProperty } from '@arco-cli/legacy/dist/types';

export type TsDocumentOptions = Partial<GenerateConfig>;

/**
 * get doc-prop for preview from parsed ts-property
 */
function getDocProp({ name, type, isOptional, tags }: PropertyType): APIProperty {
  const findDescription = (tags: TagType[]): string => {
    const enDesc = tags.find(({ name }) => name === 'en');
    const zhDesc = tags.find(({ name }) => name === 'zh');
    return zhDesc?.value || enDesc?.value || '';
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

export function parser(file: SourceFile, options?: TsDocumentOptions): Doclet[] {
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
      defaultTypeMap: {},
      ...options,
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
