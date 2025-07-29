package de.perfood.plugins.cryptoapi;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.getcapacitor.PluginCall;
import java.util.concurrent.Executor;
import org.json.JSONArray;

public class BiometryApi {

    public interface AuthenticationCallback {
        void onSuccess();
        void onError(String error);
    }

    private static final String STATUS_SUCCESS = "SUCCESS";
    private static final String STATUS_HARDWARE_UNAVAILABLE = "HARDWARE_UNAVAILABLE";
    private static final String STATUS_NONE_ENROLLED = "NONE_ENROLLED";
    private static final String STATUS_UNKNOWN = "UNKNOWN";

    private static final String HARDWARE_FINGER = "FINGER";
    private static final String HARDWARE_IRIS = "IRIS";
    private static final String HARDWARE_FACE = "FACE";

    private static Activity activity;
    private static Context context;

    public BiometryApi(Activity activity, Context context) {
        this.context = context;
        this.activity = activity;
    }

    public boolean isBiometricsEnabled(int authenticationType) {
        Log.i("BiometryApi.isBiometricsEnabled", "authenticationType: " + authenticationType);
        return this.getBiometricsStatus(authenticationType) == this.STATUS_SUCCESS;
    }

    public String getBiometricsStatus(int authenticationType) {
        Log.i("BiometryApi.getBiometricsStatus", "authenticationType: " + authenticationType);
        BiometricManager biometricManager = BiometricManager.from(this.activity.getApplicationContext());
        int canAuthenticate = biometricManager.canAuthenticate(authenticationType);
        switch (canAuthenticate) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return this.STATUS_SUCCESS;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return this.STATUS_HARDWARE_UNAVAILABLE;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return this.STATUS_NONE_ENROLLED;
            default:
                return this.STATUS_UNKNOWN;
        }
    }

    public boolean isDevicePasscodeSet() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            KeyguardManager manager = (KeyguardManager) this.activity.getSystemService(Context.KEYGUARD_SERVICE);
            return manager.isDeviceSecure();
        }

        Log.i("BiometryApi.isDevicePasscodeSet", "Android Version less than M: Biometrics Not Enabled");
        return false;
    }

    public JSONArray getAvailableHardware() {
        JSONArray hardwareArray = new JSONArray();
        PackageManager packageManager = this.activity.getPackageManager();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) hardwareArray.put(this.HARDWARE_FINGER);
        }

        if (packageManager.hasSystemFeature(PackageManager.FEATURE_IRIS)) {
            hardwareArray.put(this.HARDWARE_IRIS);
        } else {
            // check if Samsung's Iris service is present
            try {
                PackageInfo irisSamsung = packageManager.getPackageInfo("com.samsung.android.server.iris", PackageManager.GET_META_DATA);
                hardwareArray.put(this.HARDWARE_IRIS);
            } catch (PackageManager.NameNotFoundException e) {
                // do nada
            }
        }

        if (packageManager.hasSystemFeature(PackageManager.FEATURE_FACE)) {
            hardwareArray.put(this.HARDWARE_FACE);
        } else {
            // check if Samsung's Face service is present
            try {
                PackageInfo faceSamsung = packageManager.getPackageInfo(
                    "com.samsung.android.bio.face.service",
                    PackageManager.GET_META_DATA
                );
                hardwareArray.put(this.HARDWARE_FACE);
            } catch (PackageManager.NameNotFoundException e) {
                // do nada
            }
        }
        Log.i("BiometryApi.getAvailableHardware", "hardwareArray" + hardwareArray);
        return hardwareArray;
    }

    // only works if BiometricManager.BIOMETRIC_SUCCESS
    public void authenticate(int authenticationType, AuthenticationCallback authCallback) {
        Log.i("BiometryApi.authenticate", "authenticationType: " + authenticationType);

        FragmentActivity fragmentActivity = (FragmentActivity) this.activity;
        Executor executor = ContextCompat.getMainExecutor(this.context);

        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                authCallback.onSuccess();
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);

                if (errorCode == BiometricPrompt.ERROR_USER_CANCELED || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON) {
                    authCallback.onError("user_cancelled");
                } else if (errorCode == BiometricPrompt.ERROR_LOCKOUT) {
                    authCallback.onError("lockout");
                }
                authCallback.onError("signing_failed");
            }

            @Override
            public void onAuthenticationFailed() {
                super.onAuthenticationFailed();
                // User can try again
            }
        };

        new Handler(Looper.getMainLooper()).post(() -> {
            BiometricPrompt prompt = new BiometricPrompt(fragmentActivity, executor, callback);

            BiometricPrompt.PromptInfo.Builder builder = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Biometric login")
                .setSubtitle("Use biometrics to continue")
                .setAllowedAuthenticators(authenticationType);

            // if no DEVICE_CREDENTIAL is used, set negative button text
            if ((authenticationType & BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0) {
                builder.setNegativeButtonText("Cancel");
            }

            BiometricPrompt.PromptInfo promptInfo = builder.build();
            prompt.authenticate(promptInfo);
        });
    }
}
