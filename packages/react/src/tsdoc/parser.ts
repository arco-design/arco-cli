import { generate, Project } from 'ts-document';
import { InterfaceSchema, TagType } from 'ts-document/lib/interface';
import logger from '@arco-cli/legacy/dist/logger';
import { SourceFile } from '@arco-cli/legacy/dist/workspace/component/sources';

import { Doclet } from './types';

export function parser(file: SourceFile): Doclet[] {
  const filePath = file.relative;
  let doclets: Doclet[] = [];

  try {
    const componentsInfo = generate(file.path, {
      sourceFilesPaths: [file.path],
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
        return {
          filePath,
          name: title,
          description: title,
          properties: (schema as InterfaceSchema)?.data.map(({ name, type, isOptional, tags }) => {
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
          }),
        };
      });
    }
  } catch (err) {
    logger.trace(`failed parsing docs using docgen on path ${filePath} with error`, err);
  }

  return doclets;
}
