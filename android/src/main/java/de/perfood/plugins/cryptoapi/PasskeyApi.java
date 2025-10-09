package de.perfood.plugins.cryptoapi;

import android.util.Log;
import android.content.Context;
import android.os.CancellationSignal;
import com.getcapacitor.JSObject;
import androidx.credentials.CredentialManager;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.core.content.ContextCompat;
import java.util.concurrent.Executor;

public class PasskeyApi {
    private final CredentialManager credentialManager;
    private final Context context;

    public PasskeyApi(Context context) {
        this.context = context;
        this.credentialManager = CredentialManager.create(context);
    }


    public JSObject createPasskey(String requestJson, PluginCall call) {
        Log.i("PasskeyApi.createPasskey", requestJson);

        CreatePublicKeyCredentialRequest createRequest =
        new CreatePublicKeyCredentialRequest(
            requestJson,         // JSON WebAuthn CreateOptions
            null,                // clientDataHash (optional)
            true,                // preferImmediatelyAvailableCredentials
            null,                // origin (optional, typically null in apps)
            false,               // isAutoSelectAllowed
            false                // isConditional
        );

        CancellationSignal cancellationSignal = new CancellationSignal();
        Executor executor = ContextCompat.getMainExecutor(this.context);

        credentialManager.createCredentialAsync(
            this.context,         // Context
            (CreateCredentialRequest) createRequest,
            cancellationSignal,
            executor,
            new CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
                @Override
                public void onResult(CreateCredentialResponse response) {
                    // if (response.getCredential() instanceof PublicKeyCredential) {
                    //     PublicKeyCredential credential = (PublicKeyCredential) response.getCredential();

                    //     // Hole das JSON aus der Antwort
                    //     String credentialJson = credential.getRegistrationResponseJson();

                    //     JSObject result = new JSObject();
                    //     result.put("credential", new JSObject(credentialJson)); // parsed als JSObject
                    //     call.resolve(result);
                    // } else {
                    //     call.reject("Unsupported credential type");
                    // }
                }

                @Override
                public void onError(CreateCredentialException e) {
                    call.reject("Credential creation failed", e);
                }
            }
        );


        JSObject result = new JSObject();
        return result;
    }

    public JSObject authenticateWithPasskey(String requestJson) {
        Log.i("PasskeyApi.authenticateWithPasskey", requestJson);

        GetPublicKeyCredentialOption publicKeyCredentialOption =
            new GetPublicKeyCredentialOption(
                requestJson,   // WebAuthnRequestOptions JSON
                null,          // clientDataHash (optional)
                null           // allowHybrid (optional)
            );

        GetCredentialRequest getRequest = new GetCredentialRequest.Builder()
            .addCredentialOption(publicKeyCredentialOption)
            .build();

        CancellationSignal cancellationSignal = new CancellationSignal();
        Executor executor = ContextCompat.getMainExecutor(this.context);

        credentialManager.getCredentialAsync(
            this.context,
            getRequest,
            cancellationSignal,
            executor,
            new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                @Override
                public void onResult(GetCredentialResponse response) {
                    if (response.getCredential() instanceof androidx.credentials.PublicKeyCredential) {
                        androidx.credentials.PublicKeyCredential credential =
                            (androidx.credentials.PublicKeyCredential) response.getCredential();

                        String credentialJson = credential.getAuthenticationResponseJson();

                        // Sende credentialJson an deinen Server zur Verifikation
                        Log.i("Passkey Login", "Received credential: " + credentialJson);
                    } else {
                        Log.w("Passkey Login", "Nicht unterstützter Credential-Typ");
                    }
                }

                @Override
                public void onError(GetCredentialException e) {
                    Log.e("Passkey Login", "Fehler beim Login:", e);
                }
            }
        );

        JSObject result = new JSObject();
        return result;
    }

}