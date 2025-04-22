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
import java.security.KeyAgreement;
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
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class CryptoApi {

    public static String LabelECDSA = "CryptoApiECDSA:";
    private static final String AES_MODE = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12; // 96 bits for GCM
    private static final int GCM_TAG_LENGTH = 128; // bits


    public List<String> list() {
        Log.i("CryptoApi.list", "null");

        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            ArrayList<String> list = new ArrayList();

            for (String tag : Collections.list(keyStore.aliases())) {
                if (tag.startsWith(CryptoApi.LabelECDSA) && keyStore.entryInstanceOf(tag, KeyStore.PrivateKeyEntry.class)) {
                    list.add(tag.replace(CryptoApi.LabelECDSA, ""));
                }
            }

            return list;
        } catch (Error e) {
            return Collections.emptyList();
        } catch (CertificateException e) {
            return Collections.emptyList();
        } catch (KeyStoreException e) {
            return Collections.emptyList();
        } catch (IOException e) {
            return Collections.emptyList();
        } catch (NoSuchAlgorithmException e) {
            return Collections.emptyList();
        }
    }

    public String generateKey(String tag) {
        Log.i("CryptoApi.generateKey", tag);

        try {
            String publicKeyFound = this.loadKey(tag);
            if (publicKeyFound != null) {
                return publicKeyFound;
            }

            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");
            keyPairGenerator.initialize(
                new KeyGenParameterSpec.Builder(CryptoApi.LabelECDSA + tag, KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY)
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
            keyStore.deleteEntry(CryptoApi.LabelECDSA + tag);
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

    public String encrypt(String base64Data, String tag) {
        Log.i("CryptoApi.encrypt", base64Data + " " + tag);

        try {
            SecretKey secretKey = this.deriveSecret(tag);

            byte[] iv = new byte[IV_LENGTH];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(iv);

            byte[] plaintext = Base64.getDecoder().decode(base64Data);
            Cipher cipher = Cipher.getInstance(AES_MODE);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            byte[] encrypted = cipher.doFinal(plaintext);

            JSONObject result = new JSONObject();
            result.put("iv", Base64.encodeToString(iv, Base64.DEFAULT));
            result.put("encryptedData", Base64.encodeToString(encrypted, Base64.DEFAULT));
            
            return result.toString();
        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.encrypt", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.encrypt", "InvalidKeyException", e);
        } catch (InvalidAlgorithmParameterException e) {
            Log.e("CryptoApi.encrypt", "InvalidAlgorithmParameterException", e);
        } catch (JSONException e) {
            Log.e("CryptoApi.encrypt", "JSONException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.encrypt", "Unexpected exception", e);
        } 

        return null;
    }

    public String decrypt(String encryptedJson, String tag) {
        Log.i("CryptoApi.decrypt", encryptedJson + " " + tag);

        try {
            SecretKey secretKey = this.deriveSecret(tag);

            JSONObject json = new JSONObject(encryptedJson);
            String ivBase64 = json.getString("iv");
            String encryptedDataBase64 = json.getString("encryptedData");

            byte[] iv = Base64.getDecoder().decode(ivBase64);
            byte[] encryptedData = Base64.getDecoder().decode(encryptedDataBase64);

            Cipher cipher = Cipher.getInstance(AES_MODE);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            byte[] decryptedBytes = cipher.doFinal(encryptedData);

            return new String(decryptedBytes, StandardCharsets.UTF_8);

        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.decrypt", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.decrypt", "InvalidKeyException", e);
        } catch (InvalidAlgorithmParameterException e) {
            Log.e("CryptoApi.decrypt", "InvalidAlgorithmParameterException", e);
        } catch (JSONException e) {
            Log.e("CryptoApi.decrypt", "JSONException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.decrypt", "Unexpected exception", e);
        }

        return null;
    }


    private KeyStore.PrivateKeyEntry getPrivateKeyEntry(String tag) {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            return (KeyStore.PrivateKeyEntry) keyStore.getEntry(CryptoApi.LabelECDSA + tag, null);
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

    private SecretKey deriveSecret(String tag) {
        Log.i("CryptoApi.deriveSecret", publicKeyBase64 + " " + privateKeyBase64);

        try {
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag);

            if (privateKeyEntry == null) {
                Log.i("CryptoApi.deriveSecret", "No private key entry found for tag. Generating new one...");
                this.generateKey(tag);
                privateKeyEntry = this.getPrivateKeyEntry(tag);
            }

            PrivateKey privateKey = privateKeyEntry.getPrivateKey();
            PublicKey publicKey = privateKeyEntry.getCertificate().getPublicKey();

            KeyAgreement keyAgreement = KeyAgreement.getInstance("ECDH");
            keyAgreement.init(privateKey);
            keyAgreement.doPhase(publicKey, true);

            byte[] sharedSecret = keyAgreement.generateSecret();
            byte[] rawKey = Arrays.copyOf(sharedSecret, 32); // 256-bit key

            return new SecretKeySpec(rawKey, "AES");
        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.deriveSecret", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.deriveSecret", "InvalidKeyException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.deriveSecret", "Unexpected exception", e);
        }

        return null;
    }
}
