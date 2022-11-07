import { Stone } from '@arco-cli/stone';
import { UIAspect } from '@arco-cli/ui';

import '/Users/helium/Desktop/arco-cli/packages/service/ui/dist/ui.ui.runtime.js';

function renderArco() {
  console.log('__ render arco');
  return Stone.load([UIAspect], 'ui', {}).then((stone) => {
    return stone
      .run()
      .then(() => stone.get('arco.service/ui'))
      .then((rootExtension) => {
        return rootExtension.render('xxxx');
      }).catch((err) => {
        throw err;
      });
  });
}

renderArco()
