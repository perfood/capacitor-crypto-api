/**
 * Convert a base64 string to an ArrayBuffer.
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0));
}

/**
 * Convert an ArrayBuffer to a base64 string.
 */
export function arrayBufferToBase64(arrayBuffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
}

/**
 * Convert a raw (IEEE P1363) signature to an ASN.1 DER signature.
 */
export function p1363ToDer(sig: Uint8Array): Uint8Array {
  const signature = Array.from(sig, x =>
    ('00' + x.toString(16)).slice(-2),
  ).join('');
  let r = signature.substr(0, signature.length / 2);
  let s = signature.substr(signature.length / 2);
  r = r.replace(/^(00)+/, '');
  s = s.replace(/^(00)+/, '');
  if ((parseInt(r, 16) & 0x80) > 0) r = `00${r}`;
  if ((parseInt(s, 16) & 0x80) > 0) s = `00${s}`;
  const rString = `02${(r.length / 2).toString(16).padStart(2, '0')}${r}`;
  const sString = `02${(s.length / 2).toString(16).padStart(2, '0')}${s}`;
  const derSig = `30${((rString.length + sString.length) / 2)
    .toString(16)
    .padStart(2, '0')}${rString}${sString}`;

  const match = derSig.match(/[\da-f]{2}/gi);

  if (!match) throw new Error('Invalid signature');

  return new Uint8Array(match.map(h => parseInt(h, 16)));
}

/**
 * Convert an ASN.1 DER signature to a raw (IEEE P1363) signature.
 */
export function derToP1363(sig: Uint8Array): Uint8Array {
  const signature = Array.from(sig, x =>
    ('00' + x.toString(16)).slice(-2),
  ).join('');
  const rLength = parseInt(signature.substr(6, 2), 16) * 2;
  let r = signature.substr(8, rLength);
  let s = signature.substr(12 + rLength);
  r = r.length > 64 ? r.substr(-64) : r.padStart(64, '0');
  s = s.length > 64 ? s.substr(-64) : s.padStart(64, '0');
  const p1363Sig = `${r}${s}`;
  const match = p1363Sig.match(/[\da-f]{2}/gi);

  if (!match) throw new Error('Invalid signature');

  return new Uint8Array(match.map(h => parseInt(h, 16)));
}
