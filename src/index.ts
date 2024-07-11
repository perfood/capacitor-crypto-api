import { registerPlugin } from '@capacitor/core';

import type { CryptoApiPlugin } from './definitions';

const CryptoApi = registerPlugin<CryptoApiPlugin>('CryptoApi', {
  web: () => import('./web').then(m => new m.CryptoApiWeb()),
});

export * from './definitions';
export * from './utils';
export { CryptoApi };
