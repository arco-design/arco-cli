// eslint-disable-next-line import/no-extraneous-dependencies
import React, { PropsWithChildren, useMemo, useState } from 'react';

export type DocAnchorContextType = {
  anchorList: Array<{ text: string; depth: number; id?: string }>;
  updateAnchorList: (
    anchorList: DocAnchorContextType['anchorList'],
    method?: 'overwrite' | 'prepend' | 'append'
  ) => void;
};

export const DocAnchorContext = React.createContext<DocAnchorContextType>({
  anchorList: [],
  updateAnchorList: () => {},
});

export function DocAnchorContextProvider({ children }: PropsWithChildren<any>) {
  const [anchorList, setAnchorList] = useState<DocAnchorContextType['anchorList']>([]);

  const providerValue = useMemo<DocAnchorContextType>(() => {
    return {
      anchorList,
      updateAnchorList: (value, method = 'append') => {
        setAnchorList((preAnchorList) => {
          return method === 'append'
            ? [...preAnchorList, ...value]
            : method === 'prepend'
            ? [...value, ...preAnchorList]
            : value;
        });
      },
    };
  }, [anchorList]);

  return <DocAnchorContext.Provider value={providerValue}>{children}</DocAnchorContext.Provider>;
}
