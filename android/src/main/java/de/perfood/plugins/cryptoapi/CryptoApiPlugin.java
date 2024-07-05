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

        JSObject ret = new JSObject();
        ret.put("publicKey", implementation.generateKey(tag, algorithm));
        call.resolve(ret);
    }

    @PluginMethod
    public void loadKey(PluginCall call) {
        String tag = call.getString("tag");

        JSObject ret = new JSObject();
        ret.put("publicKey", implementation.loadKey(tag));
        call.resolve(ret);
    }

    @PluginMethod
    public void sign(PluginCall call) {
        String tag = call.getString("tag");
        String data = call.getString("data");

        JSObject ret = new JSObject();
        ret.put("signature", implementation.sign(tag, data));
        call.resolve(ret);
    }

    @PluginMethod
    public void decrypt(PluginCall call) {
        String tag = call.getString("tag");
        String foreignPublicKey = call.getString("foreignPublicKey");
        String iv = call.getString("iv");
        String encryptedData = call.getString("encryptedData");

        JSObject ret = new JSObject();
        ret.put("data", implementation.decrypt(tag, foreignPublicKey, iv, encryptedData));
        call.resolve(ret);
    }
}
