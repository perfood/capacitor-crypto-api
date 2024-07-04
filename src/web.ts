import { WebPlugin } from '@capacitor/core';

import type { CryptoApiPlugin } from './definitions';

export class CryptoApiWeb extends WebPlugin implements CryptoApiPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
