package de.perfood.plugins.cryptoapi;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.Signature;
import java.security.SignatureException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;

public class CryptoApi {

    public String generateKey(String tag, String algorithm) {
        Log.i("CryptoApi.generateKey", tag + " " + algorithm);

        try {
            String publicKeyFound = this.loadKey(tag);
            if (publicKeyFound != null) {
                return publicKeyFound;
            }

            KeyPairGenerator kpg = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
            kpg.initialize(
                new KeyGenParameterSpec.Builder(tag, KeyProperties.PURPOSE_SIGN).setDigests(KeyProperties.DIGEST_SHA256).build()
            );
            kpg.generateKeyPair();

            return getPublicKeyBase64(tag);
        } catch (Error e) {
            return null;
        } catch (InvalidAlgorithmParameterException e) {
            return null;
        } catch (NoSuchAlgorithmException e) {
            return null;
        } catch (NoSuchProviderException e) {
            return null;
        }
    }

    public String loadKey(String tag) {
        Log.i("CryptoApi.loadKey", tag);

        return this.getPublicKeyBase64(tag);
    }

    public String sign(String tag, String data) {
        Log.i("CryptoApi.sign", tag + " " + data);

        try {
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag);

            if (privateKeyEntry == null) {
                return null;
            }

            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(privateKeyEntry.getPrivateKey());
            signature.update(data.getBytes());

            return Base64.encodeToString(signature.sign(), Base64.DEFAULT);
        } catch (Error e) {
            return null;
        } catch (NoSuchAlgorithmException e) {
            return null;
        } catch (SignatureException e) {
            return null;
        } catch (InvalidKeyException e) {
            return null;
        }
    }

    public String decrypt(String tag, String foreignPublicKey, String initVector, String data) {
        Log.i("CryptoApi.decrypt", tag + " " + foreignPublicKey + " " + initVector + " " + data);
        return tag;
    }

    private KeyStore.PrivateKeyEntry getPrivateKeyEntry(String tag) {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            return (KeyStore.PrivateKeyEntry) keyStore.getEntry(tag, null);
        } catch (Error e) {
            return null;
        } catch (UnrecoverableEntryException e) {
            return null;
        } catch (CertificateException e) {
            return null;
        } catch (KeyStoreException e) {
            return null;
        } catch (IOException e) {
            return null;
        } catch (NoSuchAlgorithmException e) {
            return null;
        }
    }

    private String getPublicKeyBase64(String tag) {
        try {
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag);

            if (privateKeyEntry == null) {
                return null;
            }

            return Base64.encodeToString(privateKeyEntry.getCertificate().getPublicKey().getEncoded(), Base64.DEFAULT);
        } catch (Error e) {
            return null;
        }
    }
}
