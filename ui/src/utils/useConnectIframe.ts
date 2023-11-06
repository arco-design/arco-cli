import { useEffect, useState, MutableRefObject } from 'react';
import { connectToChild } from 'penpal';

const EVENT_TYPE_SIZE = 'preview-size';
const EVENT_TYPE_LOCATION_HASH = 'preview-location-hash';

export function useConnectIframe(refIframe: MutableRefObject<HTMLIFrameElement>) {
  const [height, setHeight] = useState(0);
  const [locationHash, setLocationHash] = useState('');

  useEffect(() => {
    if (!refIframe.current) return;
    connectToChild({
      iframe: refIframe.current,
      methods: {
        pub: (_event, message) => {
          switch (message.type) {
            case EVENT_TYPE_SIZE:
              setHeight(message.data.height);
              break;
            case EVENT_TYPE_LOCATION_HASH:
              setLocationHash(message.data.hash);
              break;
            default:
              break;
          }
        },
      },
    });
  }, [refIframe.current]);

  return {
    height,
    locationHash,
  };
}
