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
    public void list(PluginCall call) {
        List<String> list = implementation.list();

        JSObject ret = new JSObject();
        if (list != null) {
            ret.put("list", new JSArray(list));
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void generateKey(PluginCall call) {
        String tag = call.getString("tag");

        String publicKey = implementation.generateKey(tag);

        JSObject ret = new JSObject();
        if (publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void loadKey(PluginCall call) {
        String tag = call.getString("tag");

        String publicKey = implementation.loadKey(tag);

        JSObject ret = new JSObject();
        if (publicKey != null) {
            ret.put("publicKey", publicKey);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void deleteKey(PluginCall call) {
        String tag = call.getString("tag");

        implementation.deleteKey(tag);

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
}
