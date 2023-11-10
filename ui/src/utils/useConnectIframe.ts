import { useState, MutableRefObject, useEffect } from 'react';
import { connectToChild } from 'penpal';
import { PUBSUB_TOPIC_CHILD_TO_PARENT } from './constant';
import type { PubsubMessageType } from '../Overview/interface';

export function useConnectIframe(refIframe: MutableRefObject<HTMLIFrameElement>) {
  const [height, setHeight] = useState(0);
  const [locationHash, setLocationHash] = useState('');
  const [activeTab, setActiveTab] = useState<string>(null);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    if (!refIframe.current) return;

    connectToChild<{
      pub: (topic: string, event: PubsubMessageType) => Promise<any>;
    }>({
      iframe: refIframe.current,
      methods: {
        pub: (topic: string, message: PubsubMessageType) => {
          if (topic === PUBSUB_TOPIC_CHILD_TO_PARENT) {
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
          }
        },
      },
    })
      .promise.then((connection) => setConnection(connection))
      .catch((err) => {
        console.error(
          `[ComponentPreview] Failed to connect child iframe which is used to preview component. Details:\n${err.toString()}`
        );
      });
  }, [refIframe.current]);

  return {
    height,
    locationHash,
    activeTab,
    connection,
  };
}
