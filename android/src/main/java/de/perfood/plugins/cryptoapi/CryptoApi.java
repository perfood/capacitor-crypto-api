package de.perfood.plugins.cryptoapi;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import java.io.IOException;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PublicKey;
import java.security.Signature;
import java.security.SignatureException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;

public class CryptoApi {

    public String generateKey(String tag) {
        Log.i("CryptoApi.generateKey", tag);

        try {
            String publicKeyFound = this.loadKey(tag);
            if (publicKeyFound != null) {
                return publicKeyFound;
            }

            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
            keyPairGenerator.initialize(
                new KeyGenParameterSpec.Builder(tag, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
                    .setAlgorithmParameterSpec(new ECGenParameterSpec("secp256r1"))
                    .setDigests(KeyProperties.DIGEST_SHA256)
                    .build()
            );
            keyPairGenerator.generateKeyPair();

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

    public void deleteKey(String tag) {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            keyStore.deleteEntry(tag);
        } catch (Error e) {} catch (CertificateException e) {} catch (KeyStoreException e) {} catch (IOException e) {} catch (
            NoSuchAlgorithmException e
        ) {}
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

    public boolean verify(String foreignPublicKeyBase64, String data, String signatureBase64) {
        Log.i("CryptoApi.verify", foreignPublicKeyBase64 + " " + data + " " + signatureBase64);

        try {
            PublicKey foreignPublicKey = loadPublicKeyFromBase64(foreignPublicKeyBase64);

            if (foreignPublicKey == null) {
                return false;
            }

            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initVerify(foreignPublicKey);
            signature.update(data.getBytes());

            return signature.verify(Base64.decode(signatureBase64, Base64.DEFAULT));
        } catch (Error e) {
            return false;
        } catch (NoSuchAlgorithmException e) {
            return false;
        } catch (SignatureException e) {
            return false;
        } catch (InvalidKeyException e) {
            return false;
        }
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

    private PublicKey loadPublicKeyFromBase64(String publicKeyBase64) {
        try {
            KeyFactory keyFactory = KeyFactory.getInstance(KeyProperties.KEY_ALGORITHM_EC);
            return keyFactory.generatePublic(new X509EncodedKeySpec(Base64.decode(publicKeyBase64, Base64.DEFAULT)));
        } catch (Error e) {
            return null;
        } catch (NoSuchAlgorithmException e) {
            return null;
        } catch (InvalidKeySpecException e) {
            return null;
        }
    }
}
