// eslint-disable-next-line import/no-extraneous-dependencies
import { useEffect, useState, MutableRefObject } from 'react';
import { connectToChild } from 'penpal';

import { SizeEvent } from '../../events';

export function useIframeHeight(refIframe: MutableRefObject<HTMLIFrameElement>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!refIframe.current) return;
    connectToChild({
      iframe: refIframe.current,
      methods: {
        pub: (_event, message) => {
          if (message.type === SizeEvent.TYPE) {
            setHeight(message.data.height);
          }
        },
      },
    });
  }, [refIframe.current]);

  return height;
}
