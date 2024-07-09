package de.perfood.plugins.cryptoapi;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "CryptoApi")
public class CryptoApiPlugin extends Plugin {

    private CryptoApi implementation = new CryptoApi();

    @PluginMethod
    public void generateKey(PluginCall call) {
        String tag = call.getString("tag");
        String algorithm = call.getString("algorithm");

        String publicKey = implementation.generateKey(tag, algorithm);

        JSObject ret = new JSObject();
        if(publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void loadKey(PluginCall call) {
        String tag = call.getString("tag");

        String publicKey = implementation.loadKey(tag);

        JSObject ret = new JSObject();
        if(publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void sign(PluginCall call) {
        String tag = call.getString("tag");
        String data = call.getString("data");

        String signature = implementation.sign(tag, data);

        JSObject ret = new JSObject();
        if(signature != null) {
            ret.put("signature", signature);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String tag = call.getString("tag");
        String foreignPublicKey = call.getString("foreignPublicKey");
        String initVector = call.getString("initVector");
        String encryptedData = call.getString("encryptedData");

        String data = implementation.decrypt(tag, foreignPublicKey, initVector, encryptedData);

        JSObject ret = new JSObject();
        if(data != null) {
            ret.put("data", data);
        }
        call.resolve(ret);
    }
}
