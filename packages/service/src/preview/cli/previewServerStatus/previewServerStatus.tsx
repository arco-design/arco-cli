// eslint-disable-next-line import/no-extraneous-dependencies
import React, { useMemo } from 'react';
import { Text, Box } from 'ink';
import { head, flatten } from 'lodash';
import { ComponentServer } from '@arco-cli/aspect/dist/bundler';
import { Error, ErrorLevel } from './webpackError';
import { PreviewServerHeader } from './previewServerHeader';
import { PreviewServerRow } from './previewServerRow';
import type { CompilationResult } from '../../webpackEventsListener';

export const IGNORE_WARNINGS = [
  // Webpack 5+ has no facility to disable this warning.
  // System.import is used in @angular/core for deprecated string-form lazy routes
  /System.import\(\) is deprecated and will be removed soon/i,
  // We need to include all the files in the compilation because we don't know what people will use in their compositions
  /is part of the TypeScript compilation but it's unused/i,
  // https://github.com/webpack-contrib/source-map-loader/blob/b2de4249c7431dd8432da607e08f0f65e9d64219/src/index.js#L83
  /Failed to parse source map from/,
];

export type PreviewServerStatusProps = {
  previewServers: ComponentServer[];
  serverStats?: Record<string, CompilationResult>;
};

export function PreviewServerStatus({
  previewServers,
  serverStats: servers = {},
}: PreviewServerStatusProps) {
  const isCompiling = useMemo(() => Object.values(servers).some((x) => x.compiling), [servers]);
  const errors = useMemo(
    () =>
      head(
        Object.values(servers)
          .map((x) => x.errors)
          .filter((x) => !!x)
      ),
    [servers]
  );
  const warnings = useMemo(
    () => flatten(Object.values(servers).map((x) => x.warnings)),
    [servers]
  ).filter((warning) => !IGNORE_WARNINGS.find((reg) => warning?.message?.match(reg)));

  if (errors && errors.length) {
    return <Error errors={errors} level={ErrorLevel.ERROR} />;
  }

  if (isCompiling) {
    return <Text>Compiling...</Text>;
  }

  return (
    <>
      <PreviewServerHeader />
      {previewServers.map((server, key) => {
        return <PreviewServerRow key={key} previewServer={server} />;
      })}

      {warnings && warnings.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {/* could add dev-server name */}
          <Error errors={warnings} level={ErrorLevel.WARNING} />
        </Box>
      )}
    </>
  );
}
