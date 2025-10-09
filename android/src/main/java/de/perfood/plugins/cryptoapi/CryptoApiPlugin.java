package de.perfood.plugins.cryptoapi;

import android.app.Activity;
import androidx.biometric.BiometricManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SignatureException;
import java.util.List;
import javax.crypto.SecretKey;
import org.json.JSONArray;
import org.json.JSONObject;

@CapacitorPlugin(name = "CryptoApi")
public class CryptoApiPlugin extends Plugin {

    private static final Utils utils = new Utils();
    private static CryptoApi implementation;
    private static BiometryApi biometry;
    private static PasskeyApi passkey;

    public static final String BIOMETRY = "BIOMETRY";
    public static final String BIOMETRY_OR_PASSCODE = "BIOMETRY_OR_PASSCODE";
    public static final String PASSCODE = "PASSCODE";

    @Override
    public void load() {
        super.load();
        this.implementation = new CryptoApi(getContext());
        this.biometry = new BiometryApi(this.getActivity(), this.getContext());
        this.passkey = new PasskeyApi(this.getContext());
    }

    @PluginMethod
    public void getECDSATags(PluginCall call) {
        List<String> tags = implementation.getTags("ecdsa");

        JSObject ret = new JSObject();
        if (tags != null) {
            ret.put("tags", new JSArray(tags));
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void getECDHTags(PluginCall call) {
        List<String> tags = implementation.getTags("ecdh");

        JSObject ret = new JSObject();
        if (tags != null) {
            ret.put("tags", new JSArray(tags));
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void generateKey(PluginCall call) {
        String tag = call.getString("tag");
        String algorithm = call.getString("algorithm");
        String type = call.getString("type");
        String publicKey;

        if (type != null) {
            publicKey = implementation.generateKey(tag, algorithm, type);
        } else {
            publicKey = implementation.generateKey(tag, algorithm);
        }

        JSObject ret = new JSObject();
        if (publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void loadKey(PluginCall call) {
        String tag = call.getString("tag");
        String algorithm = call.getString("algorithm");

        String publicKey = implementation.loadKey(tag, algorithm);

        JSObject ret = new JSObject();
        if (publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void deleteKey(PluginCall call) {
        String tag = call.getString("tag");
        String algorithm = call.getString("algorithm");

        implementation.deleteKey(tag, algorithm);

        call.resolve();
    }

    @PluginMethod
    public void sign(PluginCall call) {
        String tag = call.getString("tag");
        String data = call.getString("data");
        String type = call.getString("type");

        try {
            String signature = implementation.sign(tag, data);
            JSObject ret = new JSObject();
            if (signature != null) {
                ret.put("signature", signature);
            }
            call.resolve(ret);
        } catch (InvalidKeyException e) { // UserNotAuthenticatedException belongs to InvalidKeyException
            // key is secured with biometry and needs authentication
            biometry.authenticate(
                this.getAuthenticationType(type != null ? type : CryptoApiPlugin.BIOMETRY),
                new BiometryApi.AuthenticationCallback() {
                    @Override
                    public void onSuccess() {
                        try {
                            String signature = implementation.sign(tag, data);
                            JSObject ret = new JSObject();
                            if (signature != null) {
                                ret.put("signature", signature);
                            }
                            call.resolve(ret);
                        } catch (InvalidKeyException e) {
                            call.reject("CryptoAPIPlugin.sign: Error authenticating user");
                        }
                    }

                    @Override
                    public void onError(String error) {
                        call.reject(error);
                    }
                }
            );
        }
    }

    @PluginMethod
    public void verify(PluginCall call) {
        String foreignPublicKey = call.getString("foreignPublicKey");
        String data = call.getString("data");
        String signature = call.getString("signature");

        boolean verified = implementation.verify(foreignPublicKey, data, signature);

        JSObject ret = new JSObject();
        ret.put("verified", verified);
        call.resolve(ret);
    }

    @PluginMethod
    public void encrypt(PluginCall call) {
        String tag = call.getString("tag");
        String foreignPublicKey = call.getString("foreignPublicKey");
        String plaintext = call.getString("plaintext");
        String type = call.getString("type");

        try {
            SecretKey secretKey = implementation.deriveSecret(tag, foreignPublicKey);
            JSObject encrypted = implementation.encrypt(secretKey, plaintext);
            call.resolve(encrypted);
        } catch (InvalidKeyException e) { // UserNotAuthenticatedException belongs to InvalidKeyException
            // key is secured with biometry and needs authentication
            biometry.authenticate(
                this.getAuthenticationType(type != null ? type : CryptoApiPlugin.BIOMETRY),
                new BiometryApi.AuthenticationCallback() {
                    @Override
                    public void onSuccess() {
                        try {
                            SecretKey secretKey = implementation.deriveSecret(tag, foreignPublicKey);
                            JSObject encrypted = implementation.encrypt(secretKey, plaintext);
                            call.resolve(encrypted);
                        } catch (InvalidKeyException e) {
                            call.reject("Authentication failed.");
                        }
                    }

                    @Override
                    public void onError(String error) {
                        call.reject("Authentication failed.");
                    }
                }
            );
        }
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String tag = call.getString("tag");
        String foreignPublicKey = call.getString("foreignPublicKey");
        String iv = call.getString("iv");
        String ciphertext = call.getString("ciphertext");
        String type = call.getString("type");

        try {
            SecretKey secretKey = implementation.deriveSecret(tag, foreignPublicKey);
            String plaintext = implementation.decrypt(secretKey, iv, ciphertext);

            JSObject ret = new JSObject();
            ret.put("plaintext", plaintext);
            call.resolve(ret);
        } catch (InvalidKeyException e) { // UserNotAuthenticatedException belongs to InvalidKeyException
            // key is secured with biometry and needs authentication
            biometry.authenticate(
                this.getAuthenticationType(type != null ? type : CryptoApiPlugin.BIOMETRY),
                new BiometryApi.AuthenticationCallback() {
                    @Override
                    public void onSuccess() {
                        try {
                            SecretKey secretKey = implementation.deriveSecret(tag, foreignPublicKey);
                            String plaintext = implementation.decrypt(secretKey, iv, ciphertext);

                            JSObject ret = new JSObject();
                            ret.put("plaintext", plaintext);
                            call.resolve(ret);
                        } catch (InvalidKeyException e) {
                            call.reject("Authentication failed.");
                        }
                    }

                    @Override
                    public void onError(String error) {
                        call.reject("Authentication failed.");
                    }
                }
            );
        }
    }

    @PluginMethod
    public void isBiometricsEnabled(PluginCall call) {
        String type = call.getString("type");

        boolean isEnabled = biometry.isBiometricsEnabled(this.getAuthenticationType(type));

        JSObject ret = new JSObject();
        ret.put("isEnabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void getBiometricsStatus(PluginCall call) {
        String type = call.getString("type");

        String status = biometry.getBiometricsStatus(this.getAuthenticationType(type));

        JSObject ret = new JSObject();
        ret.put("status", status);
        call.resolve(ret);
    }

    @PluginMethod
    public void getAvailableHardware(PluginCall call) {
        JSONArray hardware = biometry.getAvailableHardware();

        JSObject ret = new JSObject();
        ret.put("hardware", hardware);
        call.resolve(ret);
    }

    @PluginMethod
    public void isDevicePasscodeSet(PluginCall call) {
        boolean isDevicePasscodeSet = biometry.isDevicePasscodeSet();

        JSObject ret = new JSObject();
        ret.put("isDevicePasscodeSet", isDevicePasscodeSet);
        call.resolve(ret);
    }

    @PluginMethod
    public void hasSecureHardware(PluginCall call) {
        boolean hasSecureHardware = implementation.hasSecureHardware();

        JSObject ret = new JSObject();
        ret.put("hasSecureHardware", hasSecureHardware);
        call.resolve(ret);
    }

    @PluginMethod
    public void registerPasskey(PluginCall call) {
        JSONObject json = call.getData();
        String jsonString = json.toString();

        passkey.createPasskey(jsonString, call);
    }

    @PluginMethod
    public void authenticateWithPasskey(PluginCall call) {
        JSONObject json = call.getData();
        String jsonString = json.toString();

        JSObject result = passkey.authenticateWithPasskey(jsonString);
        call.resolve(result);
    }

    private int getAuthenticationType(String type) {
        switch (type) {
            case CryptoApiPlugin.BIOMETRY:
                return BiometricManager.Authenticators.BIOMETRIC_STRONG;
            case CryptoApiPlugin.BIOMETRY_OR_PASSCODE:
                return BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL;
            case CryptoApiPlugin.PASSCODE:
                return BiometricManager.Authenticators.DEVICE_CREDENTIAL;
        }

        throw new IllegalArgumentException("Unknown BiometryType: " + type);
    }
}
