package de.perfood.plugins.cryptoapi;

import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.InvalidAlgorithmParameterException;
import java.security.InvalidKeyException;
import java.security.KeyFactory;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.NoSuchProviderException;
import java.security.PrivateKey;
import java.security.PublicKey;
import java.security.SecureRandom;
import java.security.Signature;
import java.security.SignatureException;
import java.security.UnrecoverableEntryException;
import java.security.cert.CertificateException;
import java.security.spec.ECGenParameterSpec;
import java.security.spec.InvalidKeySpecException;
import java.security.spec.X509EncodedKeySpec;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import javax.crypto.Cipher;
import javax.crypto.KeyAgreement;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;

public class CryptoApi {

    public static String LabelECDSA = "CryptoApiECDSA:";
    public static String LabelECDH = "CryptoApiECDH:";
    private static final String AES_MODE = "AES/GCM/NoPadding";
    private static final int IV_LENGTH = 12; // 96 bits for GCM
    private static final int GCM_TAG_LENGTH = 128; // bits

    public List<String> getTags(String algorithm) {
        Log.i("CryptoApi.getTags", algorithm);

        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            ArrayList<String> list = new ArrayList<>();
            String label = this.getLabel(algorithm);

            for (String tag : Collections.list(keyStore.aliases())) {
                if (tag.startsWith(label) && keyStore.entryInstanceOf(tag, KeyStore.PrivateKeyEntry.class)) {
                    list.add(tag.replace(label, ""));
                }
            }

            return list;
        } catch (Error | CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException e) {
            return Collections.emptyList();
        }
    }

    public String generateKey(String tag, String algorithm) {
        Log.i("CryptoApi.generateKey", tag + " " + algorithm);

        try {
            String publicKeyFound = this.loadKey(tag, algorithm);
            if (publicKeyFound != null) {
                return publicKeyFound;
            }

            String label = this.getLabel(algorithm);
            KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore");

            int purpose = algorithm.equalsIgnoreCase("ecdsa")
                ? KeyProperties.PURPOSE_SIGN | KeyProperties.PURPOSE_VERIFY
                : KeyProperties.PURPOSE_AGREE_KEY;

            KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(label + tag, purpose).setAlgorithmParameterSpec(
                new ECGenParameterSpec("secp256r1")
            );

            // Only set digests if it's ECDSA
            if (algorithm.equalsIgnoreCase("ecdsa")) {
                builder.setDigests(KeyProperties.DIGEST_SHA256);
            }

            keyPairGenerator.initialize(builder.build());
            keyPairGenerator.generateKeyPair();

            return getPublicKeyBase64(tag, algorithm);
        } catch (Error | InvalidAlgorithmParameterException | NoSuchAlgorithmException | NoSuchProviderException e) {
            return null;
        }
    }

    public String loadKey(String tag, String algorithm) {
        Log.i("CryptoApi.loadKey", tag + " " + algorithm);

        return this.getPublicKeyBase64(tag, algorithm);
    }

    public void deleteKey(String tag, String algorithm) {
        Log.i("CryptoApi.deleteKey", tag + " " + algorithm);

        try {
            String label = this.getLabel(algorithm);
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            keyStore.deleteEntry(label + tag);
        } catch (Error | CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException e) {
            return;
        }
    }

    public String sign(String tag, String data) {
        Log.i("CryptoApi.sign", tag + " " + data);

        try {
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag, CryptoApi.LabelECDSA);

            if (privateKeyEntry == null) {
                return null;
            }

            Signature signature = Signature.getInstance("SHA256withECDSA");
            signature.initSign(privateKeyEntry.getPrivateKey());
            signature.update(data.getBytes());

            return Base64.encodeToString(signature.sign(), Base64.DEFAULT);
        } catch (Error | NoSuchAlgorithmException | SignatureException | InvalidKeyException e) {
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
        } catch (Error | NoSuchAlgorithmException | SignatureException | InvalidKeyException e) {
            return false;
        }
    }

    public JSObject encrypt(String tag, String foreignPublicKey, String plaintext) {
        Log.i("CryptoApi.encrypt", tag + " " + foreignPublicKey + " " + plaintext);

        try {
            SecretKey secretKey = this.deriveSecret(tag, foreignPublicKey);

            byte[] iv = new byte[IV_LENGTH];
            SecureRandom secureRandom = new SecureRandom();
            secureRandom.nextBytes(iv);

            byte[] plaintextBytes = plaintext.getBytes(StandardCharsets.UTF_8);
            Cipher cipher = Cipher.getInstance(AES_MODE);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, iv);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec);
            byte[] encrypted = cipher.doFinal(plaintextBytes);

            JSObject result = new JSObject();
            result.put("iv", Base64.encodeToString(iv, Base64.DEFAULT));
            result.put("ciphertext", Base64.encodeToString(encrypted, Base64.DEFAULT));

            return result;
        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.encrypt", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.encrypt", "InvalidKeyException", e);
        } catch (InvalidAlgorithmParameterException e) {
            Log.e("CryptoApi.encrypt", "InvalidAlgorithmParameterException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.encrypt", "Unexpected exception", e);
        }

        return null;
    }

    public String decrypt(String tag, String foreignPublicKey, String iv, String ciphertext) {
        Log.i("CryptoApi.decrypt", tag + " " + foreignPublicKey + " " + iv + " " + ciphertext);

        try {
            SecretKey secretKey = this.deriveSecret(tag, foreignPublicKey);

            byte[] ivBytes = Base64.decode(iv, Base64.DEFAULT);
            byte[] ciphertextBytes = Base64.decode(ciphertext, Base64.DEFAULT);

            Cipher cipher = Cipher.getInstance(AES_MODE);
            GCMParameterSpec gcmSpec = new GCMParameterSpec(GCM_TAG_LENGTH, ivBytes);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec);
            byte[] decryptedBytes = cipher.doFinal(ciphertextBytes);

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.decrypt", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.decrypt", "InvalidKeyException", e);
        } catch (InvalidAlgorithmParameterException e) {
            Log.e("CryptoApi.decrypt", "InvalidAlgorithmParameterException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.decrypt", "Unexpected exception", e);
        }

        return null;
    }

    private KeyStore.PrivateKeyEntry getPrivateKeyEntry(String tag, String label) {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);

            return (KeyStore.PrivateKeyEntry) keyStore.getEntry(label + tag, null);
        } catch (
            Error | UnrecoverableEntryException | CertificateException | KeyStoreException | IOException | NoSuchAlgorithmException e
        ) {
            return null;
        }
    }

    private String getPublicKeyBase64(String tag, String algorithm) {
        try {
            String label = this.getLabel(algorithm);
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag, label);

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
        } catch (Error | NoSuchAlgorithmException | InvalidKeySpecException e) {
            return null;
        }
    }

    private SecretKey deriveSecret(String tag, String foreignPublicKeyBase64) {
        Log.i("CryptoApi.deriveSecret", tag + " " + foreignPublicKeyBase64);

        try {
            KeyStore.PrivateKeyEntry privateKeyEntry = this.getPrivateKeyEntry(tag, CryptoApi.LabelECDH);

            if (privateKeyEntry == null) {
                Log.i("CryptoApi.deriveSecret", "No private key entry found for tag. Generating new one...");
                this.generateKey(tag, "ecdh");
                privateKeyEntry = this.getPrivateKeyEntry(tag, CryptoApi.LabelECDH);
                if (privateKeyEntry == null) {
                    return null;
                }
            }

            PrivateKey privateKey = privateKeyEntry.getPrivateKey();
            PublicKey foreignPublicKey = loadPublicKeyFromBase64(foreignPublicKeyBase64);

            KeyAgreement keyAgreement = KeyAgreement.getInstance("ECDH");
            keyAgreement.init(privateKey);
            keyAgreement.doPhase(foreignPublicKey, true);

            byte[] sharedSecret = keyAgreement.generateSecret();
            byte[] rawKey = Arrays.copyOf(sharedSecret, 32); // 256-bit key

            return new SecretKeySpec(rawKey, "AES");
        } catch (Error e) {
            Log.e("CryptoApi.deriveSecret", "Error", e);
        } catch (NullPointerException e) {
            Log.e("CryptoApi.deriveSecret", "NullPointerException", e);
        } catch (NoSuchAlgorithmException e) {
            Log.e("CryptoApi.deriveSecret", "NoSuchAlgorithmException", e);
        } catch (InvalidKeyException e) {
            Log.e("CryptoApi.deriveSecret", "InvalidKeyException", e);
        } catch (Exception e) {
            Log.e("CryptoApi.deriveSecret", "Unexpected exception", e);
        }

        return null;
    }

    private String getLabel(String algorithm) {
        return algorithm.equalsIgnoreCase("ecdsa") ? CryptoApi.LabelECDSA : CryptoApi.LabelECDH;
    }
}
