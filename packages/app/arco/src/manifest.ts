import { AspectLoaderAspect } from '@arco-cli/aspect-loader';
import { LoggerAspect } from '@arco-cli/logger';
import { PubsubAspect } from '@arco-cli/pubsub';
import { ExpressAspect } from '@arco-cli/express';
import { GraphqlAspect } from '@arco-cli/graphql';
import { ComponentAspect } from '@arco-cli/component';
import { EnvsAspect } from '@arco-cli/envs';
import { ReactAspect } from '@arco-cli/react';
import { ReactRouterAspect } from '@arco-cli/react-router';
import { BundlerAspect } from '@arco-cli/bundler';
import { PreviewAspect } from '@arco-cli/preview';
import { TesterAspect } from '@arco-cli/tester';
import { CompilerAspect } from '@arco-cli/compiler';
import { BuilderAspect } from '@arco-cli/builder';
import { JestAspect } from '@arco-cli/jest';
import { DocsAspect } from '@arco-cli/docs';
import { UIAspect } from '@arco-cli/ui';
import { WorkspaceAspect } from '@arco-cli/workspace';
import { LessAspect } from '@arco-cli/less';
import { SassAspect } from '@arco-cli/sass';
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
  [PreviewAspect.id]: PreviewAspect,
  [TesterAspect.id]: TesterAspect,
  [BuilderAspect.id]: BuilderAspect,
  [CompilerAspect.id]: CompilerAspect,
  [JestAspect.id]: JestAspect,
  [DocsAspect.id]: DocsAspect,
  [UIAspect.id]: UIAspect,
  [LessAspect.id]: LessAspect,
  [SassAspect.id]: SassAspect,
  [WorkspaceAspect.id]: WorkspaceAspect,
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
