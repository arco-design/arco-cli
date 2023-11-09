// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, PropsWithChildren, useEffect, useMemo, useRef } from 'react';
import type { Pubsub } from '@arco-cli/aspect/dist/pubsub/previewRuntime';

const GLOBAL_METHOD_MAP_KEY = '__arcoPreviewMethods';

type PreviewGlobalMethodName = 'updateAnchorOffset' | 'updateMDXPreviewActiveTab';

type PreviewContextType = {
  pubsub?: Pubsub;
  pubsubTopic?: string;
  registerGlobalMethod: (name: PreviewGlobalMethodName, fn: (...args: any) => any) => void;
};

export const PreviewContext = createContext<PreviewContextType>({
  registerGlobalMethod: () => {},
});

export function PreviewContextProvider(
  props: PropsWithChildren<Pick<PreviewContextType, 'pubsub' | 'pubsubTopic'>>
) {
  const { children, pubsub, pubsubTopic } = props;
  const refGlobalMethodsMap = useRef<Record<string, any>>({});

  useEffect(() => {
    (window as any)[GLOBAL_METHOD_MAP_KEY] = refGlobalMethodsMap.current;
  }, []);

  const previewContextValue = useMemo<PreviewContextType>(() => {
    return {
      pubsub,
      pubsubTopic,
      registerGlobalMethod: (name, fn) => {
        refGlobalMethodsMap.current[name] = fn;
      },
    };
  }, []);

  return <PreviewContext.Provider value={previewContextValue}>{children}</PreviewContext.Provider>;
}
