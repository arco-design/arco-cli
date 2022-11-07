// eslint-disable-next-line import/no-extraneous-dependencies
import { useContext, useEffect, useState } from 'react';
import { v1 } from 'uuid';

import { LoaderContext } from './loaderContext';

export function useLoader(loading: boolean) {
  const [id] = useState(() => v1());
  const ctx = useContext(LoaderContext);

  useEffect(() => {
    ctx.update(id, loading);
    return () => {
      ctx.remove(id);
    };
  }, [loading, ctx, id]);
}
