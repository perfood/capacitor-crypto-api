package de.perfood.plugins.cryptoapi;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

@CapacitorPlugin(name = "CryptoApi")
public class CryptoApiPlugin extends Plugin {

    private CryptoApi implementation = new CryptoApi();

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

        String publicKey = implementation.generateKey(tag, algorithm);

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

        String signature = implementation.sign(tag, data);

        JSObject ret = new JSObject();
        if (signature != null) {
            ret.put("signature", signature);
        }
        call.resolve(ret);
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
        String data = call.getString("data");
        String tag = call.getString("tag");

        String encrypted = implementation.encrypt(data, tag);

        JSObject ret = new JSObject();
        ret.put("encrypted", encrypted);
        call.resolve(ret);
    }  

    @PluginMethod
    public void decrypt(PluginCall call) {
        String data = call.getString("data");
        String tag = call.getString("tag");

        String decrypted = implementation.decrypt(data, tag);

        JSObject ret = new JSObject();
        ret.put("decrypted", decrypted);
        call.resolve(ret);
    }  

}
