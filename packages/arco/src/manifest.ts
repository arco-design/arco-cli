import { AspectLoaderAspect } from '@arco-cli/core/dist/aspect-loader';
import { LoggerAspect } from '@arco-cli/core/dist/logger';
import { PubsubAspect } from '@arco-cli/aspect/dist/pubsub';
import { ExpressAspect } from '@arco-cli/core/dist/express';
import { GraphqlAspect } from '@arco-cli/core/dist/graphql';
import { ComponentAspect } from '@arco-cli/aspect/dist/component';
import { EnvsAspect } from '@arco-cli/aspect/dist/envs';
import { ReactAspect } from '@arco-cli/react';
import { ReactRouterAspect } from '@arco-cli/aspect/dist/react-router';
import { BundlerAspect } from '@arco-cli/aspect/dist/bundler';
import { JestAspect } from '@arco-cli/aspect/dist/jest';
import { DocsAspect } from '@arco-cli/aspect/dist/docs';
import { WorkspaceAspect } from '@arco-cli/aspect/dist/workspace';
import { LessAspect } from '@arco-cli/aspect/dist/less';
import { SassAspect } from '@arco-cli/aspect/dist/sass';
import { MDXAspect } from '@arco-cli/aspect/dist/mdx';
import { UIAspect } from '@arco-cli/service/dist/ui';
import { PreviewAspect } from '@arco-cli/service/dist/preview';
import { TesterAspect } from '@arco-cli/service/dist/tester';
import { CompilerAspect } from '@arco-cli/service/dist/compiler';
import { BuilderAspect } from '@arco-cli/service/dist/builder';
import { SyncerAspect } from '@arco-cli/service/dist/syncer';
import { ArcoAspect } from './arco.aspect';

export const manifestMap = {
  [AspectLoaderAspect.id]: AspectLoaderAspect,
  [LoggerAspect.id]: LoggerAspect,
  [PubsubAspect.id]: PubsubAspect,
  [ExpressAspect.id]: ExpressAspect,
  [GraphqlAspect.id]: GraphqlAspect,
  [ComponentAspect.id]: ComponentAspect,
  [EnvsAspect.id]: EnvsAspect,
  [ReactAspect.id]: ReactAspect,
  [ReactRouterAspect.id]: ReactRouterAspect,
  [BundlerAspect.id]: BundlerAspect,
  [JestAspect.id]: JestAspect,
  [DocsAspect.id]: DocsAspect,
  [LessAspect.id]: LessAspect,
  [SassAspect.id]: SassAspect,
  [WorkspaceAspect.id]: WorkspaceAspect,
  [MDXAspect.id]: MDXAspect,
  [UIAspect.id]: UIAspect,
  [PreviewAspect.id]: PreviewAspect,
  [CompilerAspect.id]: CompilerAspect,
  [TesterAspect.id]: TesterAspect,
  [BuilderAspect.id]: BuilderAspect,
  [SyncerAspect.id]: SyncerAspect,
};

export function isCoreAspect(id: string) {
  const _reserved = [ArcoAspect.id];
  if (_reserved.includes(id)) return true;
  return !!manifestMap[id];
}

export function getAllCoreAspectsIds(): string[] {
  const _reserved = [ArcoAspect.id];
  return [...Object.keys(manifestMap), ..._reserved];
}
