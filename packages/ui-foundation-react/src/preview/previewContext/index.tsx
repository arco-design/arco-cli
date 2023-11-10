// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import type { Pubsub } from '@arco-cli/aspect/dist/pubsub/previewRuntime';

const GLOBAL_MAP_KEY = '__ARCO_PREVIEW_GLOBAL_VARIABLES';

type PreviewContextType = {
  pubsub?: Pubsub;
  pubsubTopic?: string;
  pubsubTopicParent?: string;
  registerGlobalVariable: (name: string, variable: any) => void;
};

export const PreviewContext = createContext<PreviewContextType>({
  registerGlobalVariable: () => {},
});

export function PreviewContextProvider(
  props: PropsWithChildren<Pick<PreviewContextType, 'pubsub' | 'pubsubTopic' | 'pubsubTopicParent'>>
) {
  const { children, pubsub, pubsubTopic, pubsubTopicParent } = props;
  const refGlobalVariablesMap = useRef<Record<string, any>>({
    // this is the version for preview App
    parentMessageIsSubscribed: true,
  });

  useEffect(() => {
    (window as any)[GLOBAL_MAP_KEY] = refGlobalVariablesMap.current;
  }, []);

  const previewContextValue = useMemo<PreviewContextType>(() => {
    return {
      pubsub,
      pubsubTopic,
      pubsubTopicParent,
      registerGlobalVariable: (name, fn) => {
        refGlobalVariablesMap.current[name] = fn;
      },
    };
  }, []);

  return <PreviewContext.Provider value={previewContextValue}>{children}</PreviewContext.Provider>;
}
