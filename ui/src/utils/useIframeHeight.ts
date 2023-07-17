import { useEffect, useState, MutableRefObject } from 'react';
import { connectToChild } from 'penpal';

const SIZE_EVENT_TYPE = 'preview-size';

export function useIframeHeight(refIframe: MutableRefObject<HTMLIFrameElement>) {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!refIframe.current) return;
    connectToChild({
      iframe: refIframe.current,
      methods: {
        pub: (_event, message) => {
          if (message.type === SIZE_EVENT_TYPE) {
            setHeight(message.data.height);
          }
        },
      },
    });
  }, [refIframe.current]);

  return height;
}
