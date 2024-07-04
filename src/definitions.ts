export interface CryptoApiPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
