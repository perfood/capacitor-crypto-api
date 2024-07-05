package de.perfood.plugins.cryptoapi;

import android.util.Log;

public class CryptoApi {

    public String generateKey(String tag, String algorithm) {
        Log.i("generateKey", tag);
        Log.i("generateKey", algorithm);
        return tag;
    }

    public String loadKey(String tag) {
        Log.i("loadKey", tag);
        return tag;
    }

    public String sign(String tag, String data) {
        Log.i("sign", tag);
        Log.i("sign", data);
        return tag;
    }

    public String decrypt(String tag, String foreignPublicKey, String initVector, String data) {
        Log.i("decrypt", tag);
        Log.i("decrypt", foreignPublicKey);
        Log.i("decrypt", initVector);
        Log.i("decrypt", data);
        return tag;
    }
}
