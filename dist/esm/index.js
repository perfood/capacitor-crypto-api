import { registerPlugin } from '@capacitor/core';
const CryptoApi = registerPlugin('CryptoApi', {
    web: () => import('./web').then((m) => new m.CryptoApiWeb()),
});
export * from './definitions';
export * from './utils';
export { CryptoApi };
//# sourceMappingURL=index.js.map