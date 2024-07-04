import { CryptoApi } from '@perfood/capacitor-crypto-api';

window.testEcho = async () => {
  const inputValue = document.getElementById('echoInput').value;
  const echo = await CryptoApi.echo({ value: inputValue });
  alert(echo.value);
};
