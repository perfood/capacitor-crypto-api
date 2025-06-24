package de.perfood.plugins.cryptoapi;

import android.os.Build;

public class Utils {

    public boolean isEmulator() {
        String fingerprint = android.os.Build.FINGERPRINT;
        String model = android.os.Build.MODEL;
        String manufacturer = android.os.Build.MANUFACTURER;
        String brand = android.os.Build.BRAND;
        String device = android.os.Build.DEVICE;
        String product = android.os.Build.PRODUCT;
        String hardware = android.os.Build.HARDWARE;

        return fingerprint.startsWith("generic")
            || fingerprint.toLowerCase().contains("vbox")
            || fingerprint.toLowerCase().contains("test-keys")
            || model.contains("Emulator")
            || model.contains("Android SDK built for x86")
            || model.contains("google_sdk")
            || manufacturer.contains("Genymotion")
            || (brand.startsWith("generic") && device.startsWith("generic"))
            || "google_sdk".equals(product)
            || hardware.contains("goldfish")
            || hardware.contains("ranchu")
            || hardware.contains("qcom") && product.contains("sdk");
    }
}
