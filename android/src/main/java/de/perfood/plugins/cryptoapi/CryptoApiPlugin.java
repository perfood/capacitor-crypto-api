package de.perfood.plugins.cryptoapi;

import android.app.Activity;
import androidx.biometric.BiometricManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;
import org.json.JSONArray;
import android.security.keystore.UserNotAuthenticatedException;
import java.security.SignatureException;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;

@CapacitorPlugin(name = "CryptoApi")
public class CryptoApiPlugin extends Plugin {

    private static final CryptoApi implementation = new CryptoApi();
    private static final BiometryApi biometry = new BiometryApi();
    private static final Utils utils = new Utils();

    public static final String BIOMETRY = "BIOMETRY";
    public static final String BIOMETRY_OR_PASSCODE = "BIOMETRY_OR_PASSCODE";
    public static final String PASSCODE = "PASSCODE";

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
            int authenticationType = this.getAuthenticationType(type);
            if (!utils.isEmulator() && !biometry.deviceSupportsStrongBox(this.getContext())) {
                call.reject("Error generating biometric secured key on android. StrongBox is not supported.");
                return;
            }
            publicKey = implementation.generateKey(tag, algorithm, authenticationType);
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
        } catch (UserNotAuthenticatedException e) {
            // key is secured with biometry and needs authentication
            biometry.authenticate(
                this.getActivity(),
                this.getContext(),
                this.getAuthenticationType(type != null ? type : CryptoApiPlugin.BIOMETRY_OR_PASSCODE),
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
                        } catch (UserNotAuthenticatedException e) {
                            call.reject("CryptoAPIPlugin.sign: Error authenticating user");
                        } catch (Error | NoSuchAlgorithmException | SignatureException | InvalidKeyException e) {
                            call.reject("CryptoAPIPlugin.sign: Error" + e);
                        }
                    }

                    @Override
                    public void onError(String error) {
                        call.reject(error);
                    }
                }
            );
        } catch (Error | NoSuchAlgorithmException | SignatureException | InvalidKeyException e) {
            call.reject("CryptoAPIPlugin.sign: Error" + e);
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

        JSObject encrypted = implementation.encrypt(tag, foreignPublicKey, plaintext);

        call.resolve(encrypted);
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String tag = call.getString("tag");
        String foreignPublicKey = call.getString("foreignPublicKey");
        String iv = call.getString("iv");
        String ciphertext = call.getString("ciphertext");

        String plaintext = implementation.decrypt(tag, foreignPublicKey, iv, ciphertext);

        JSObject ret = new JSObject();
        ret.put("plaintext", plaintext);
        call.resolve(ret);
    }

    @PluginMethod
    public void isBiometricsEnabled(PluginCall call) {
        String type = call.getString("type");

        boolean isEnabled = biometry.isBiometricsEnabled(this.getActivity(), this.getAuthenticationType(type));

        JSObject ret = new JSObject();
        ret.put("isEnabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void getBiometricsStatus(PluginCall call) {
        String type = call.getString("type");

        BiometryApi.BiometricsStatus status = biometry.getBiometricsStatus(this.getActivity(), this.getAuthenticationType(type));

        JSObject ret = new JSObject();
        ret.put("status", status);
        call.resolve(ret);
    }

    @PluginMethod
    public void getAvailableHardware(PluginCall call) {
        JSONArray hardware = biometry.getAvailableHardware(this.getActivity());

        JSObject ret = new JSObject();
        ret.put("hardware", hardware);
        call.resolve(ret);
    }

    @PluginMethod
    public void isDevicePasscodeSet(PluginCall call) {
        boolean isDevicePasscodeSet = biometry.isDevicePasscodeSet(this.getActivity());

        JSObject ret = new JSObject();
        ret.put("isDevicePasscodeSet", isDevicePasscodeSet);
        call.resolve(ret);
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

        throw new IllegalArgumentException("Unbekannter BiometryType: " + type);
    }
}
