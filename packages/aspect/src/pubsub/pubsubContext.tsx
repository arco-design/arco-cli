import React, { createContext, useContext, useEffect, RefObject, ReactNode } from 'react';

export interface PubsubRegistry {
  /**
   * starts a connection to an iframe child.
   * Returns a destroy function that will break the connection.
   */
  connect(ref: HTMLIFrameElement): () => void;
}

export const PubsubContext = createContext<PubsubRegistry | undefined>(undefined);

export function createProvider(pubSubContext: PubsubRegistry) {
  return function PubsubProvider({ children }: { children: ReactNode }) {
    return <PubsubContext.Provider value={pubSubContext}>{children}</PubsubContext.Provider>;
  };
}

export function usePubsub() {
  return useContext(PubsubContext);
}

export function usePubsubIframe(ref?: RefObject<HTMLIFrameElement>) {
  const pubSub = usePubsub();

  useEffect(() => {
    if (!ref?.current || !pubSub) return () => {};

    const destroyConnection = pubSub.connect(ref.current);
    return () => destroyConnection();
  }, [ref?.current, pubSub]);
}
