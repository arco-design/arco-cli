import { useEffect, useState, MutableRefObject } from 'react';
import { connectToChild } from 'penpal';

export function useConnectIframe(refIframe: MutableRefObject<HTMLIFrameElement>) {
  const [height, setHeight] = useState(0);
  const [locationHash, setLocationHash] = useState('');
  const [activeTab, setActiveTab] = useState<string>(null);

  useEffect(() => {
    if (!refIframe.current) return;
    connectToChild({
      iframe: refIframe.current,
      methods: {
        pub: (_event, message) => {
          switch (message.type) {
            case 'preview-size':
              setHeight(message.data.height);
              break;
            case 'preview-location-hash':
              setLocationHash(message.data.hash);
              break;
            case 'preview-active-tab':
              setActiveTab(message.data.activeTab || '');
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
    activeTab,
  };
}
