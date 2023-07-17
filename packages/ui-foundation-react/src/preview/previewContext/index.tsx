// eslint-disable-next-line import/no-extraneous-dependencies
import React, { createContext, PropsWithChildren, useEffect, useMemo, useRef } from 'react';

const GLOBAL_METHOD_MAP_KEY = '__arcoPreviewMethods';

type PreviewGlobalMethodName = 'updateAnchorOffset';

type PreviewContextType = {
  registerGlobalMethod: (name: PreviewGlobalMethodName, fn: (...args: any) => any) => void;
};

export const PreviewContext = createContext<PreviewContextType>({
  registerGlobalMethod: () => {},
});

export function PreviewContextProvider(props: PropsWithChildren<any>) {
  const { children } = props;
  const refGlobalMethodsMap = useRef<Record<string, any>>({});

  useEffect(() => {
    (window as any)[GLOBAL_METHOD_MAP_KEY] = refGlobalMethodsMap.current;
  }, []);

  const previewContextValue = useMemo<PreviewContextType>(() => {
    return {
      registerGlobalMethod: (name, fn) => {
        refGlobalMethodsMap.current[name] = fn;
      },
    };
  }, []);

  return <PreviewContext.Provider value={previewContextValue}>{children}</PreviewContext.Provider>;
}
