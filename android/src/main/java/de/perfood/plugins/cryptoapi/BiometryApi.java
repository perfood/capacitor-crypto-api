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
import java.util.concurrent.Executor;
import org.json.JSONArray;
import com.getcapacitor.PluginCall;

public class BiometryApi {

    public interface AuthenticationCallback {
        void onSuccess();
        void onError(String error);
    }

    public enum BiometricsStatus {
        SUCCESS,
        HARDWARE_UNAVAILABLE,
        NONE_ENROLLED,
        UNKNOWN
    }

    public enum BiometricHardware {
        FINGER,
        IRIS,
        FACE
    }

    public boolean isBiometricsEnabled(Activity activity, int authenticationType) {
        Log.i("BiometryApi.isBiometricsEnabled", "authenticationType: " + authenticationType);
        return this.getBiometricsStatus(activity, authenticationType) == BiometricsStatus.SUCCESS;
    }

    public BiometricsStatus getBiometricsStatus(Activity activity, int authenticationType) {
        Log.i("BiometryApi.getBiometricsStatus", "authenticationType: " + authenticationType);
        BiometricManager biometricManager = BiometricManager.from(activity.getApplicationContext());
        int canAuthenticate = biometricManager.canAuthenticate(authenticationType);
        switch (canAuthenticate) {
            case BiometricManager.BIOMETRIC_SUCCESS:
                return BiometricsStatus.SUCCESS;
            case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
            case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                return BiometricsStatus.HARDWARE_UNAVAILABLE;
            case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                return BiometricsStatus.NONE_ENROLLED;
            default:
                return BiometricsStatus.UNKNOWN;
        }
    }

    public boolean isDevicePasscodeSet(Activity activity) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            KeyguardManager manager = (KeyguardManager) activity.getSystemService(Context.KEYGUARD_SERVICE);
            return manager.isDeviceSecure();
        }

        Log.i("BiometryApi.isDevicePasscodeSet", "Android Version less than M: Biometrics Not Enabled");
        return false;
    }

    public JSONArray getAvailableHardware(Activity activity) {
        JSONArray hardwareArray = new JSONArray();
        PackageManager packageManager = activity.getPackageManager();

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            if (packageManager.hasSystemFeature(PackageManager.FEATURE_FINGERPRINT)) hardwareArray.put(BiometricHardware.FINGER);
        }

        if (packageManager.hasSystemFeature(PackageManager.FEATURE_IRIS)) {
            hardwareArray.put(BiometricHardware.IRIS);
        } else {
            // check if Samsung's Iris service is present
            try {
                PackageInfo irisSamsung = packageManager.getPackageInfo("com.samsung.android.server.iris", PackageManager.GET_META_DATA);
                hardwareArray.put(BiometricHardware.IRIS);
            } catch (PackageManager.NameNotFoundException e) {
                // do nada
            }
        }

        if (packageManager.hasSystemFeature(PackageManager.FEATURE_FACE)) {
            hardwareArray.put(BiometricHardware.FACE);
        } else {
            // check if Samsung's Face service is present
            try {
                PackageInfo faceSamsung = packageManager.getPackageInfo(
                    "com.samsung.android.bio.face.service",
                    PackageManager.GET_META_DATA
                );
                hardwareArray.put(BiometricHardware.FACE);
            } catch (PackageManager.NameNotFoundException e) {
                // do nada
            }
        }
        Log.i("BiometryApi.getAvailableHardware", "hardwareArray" + hardwareArray);
        return hardwareArray;
    }

    public void enrollBiometrics(Activity activity, int authenticationType) {
        Log.i("BiometryApi.enrollBiometrics", "authenticationType: " + authenticationType);

        // Prompts the user to create credentials that your app accepts.
        final Intent enrollIntent = new Intent(Settings.ACTION_BIOMETRIC_ENROLL);
        enrollIntent.putExtra(Settings.EXTRA_BIOMETRIC_AUTHENTICATORS_ALLOWED, authenticationType);
        activity.startActivity(enrollIntent);
    }

    // only works if BiometricManager.BIOMETRIC_SUCCESS
    public void authenticate(Activity activity, Context context, int authenticationType, AuthenticationCallback authCallback) {
        Log.i("BiometryApi.authenticate", "authenticationType: " + authenticationType);

        FragmentActivity fragmentActivity = (FragmentActivity) activity;
        Executor executor = ContextCompat.getMainExecutor(context);

        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                super.onAuthenticationSucceeded(result);
                authCallback.onSuccess();
            }

            @Override
            public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                super.onAuthenticationError(errorCode, errString);
                authCallback.onError("Authentication error: " + errString);
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

            if ((authenticationType & BiometricManager.Authenticators.DEVICE_CREDENTIAL) == 0) {
                builder.setNegativeButtonText("Cancel");
            }

            BiometricPrompt.PromptInfo promptInfo = builder.build();
            prompt.authenticate(promptInfo);
        });
    }

    public boolean deviceSupportsStrongBox(Context context) {
        return (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.P &&
            context.getPackageManager().hasSystemFeature("android.hardware.strongbox_keystore")
        );
    }
}
