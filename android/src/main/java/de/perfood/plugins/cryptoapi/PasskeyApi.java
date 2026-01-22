package de.perfood.plugins.cryptoapi;

import android.content.Context;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.util.Log;
import androidx.core.content.ContextCompat;
import androidx.credentials.CreateCredentialRequest;
import androidx.credentials.CreateCredentialResponse;
import androidx.credentials.CreatePublicKeyCredentialRequest;
import androidx.credentials.CreatePublicKeyCredentialResponse;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.GetPublicKeyCredentialOption;
import androidx.credentials.PublicKeyCredential;
import androidx.credentials.exceptions.CreateCredentialException;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import java.util.Collections;
import java.util.concurrent.Executor;
import org.json.JSONException;
import org.json.JSONObject;

public class PasskeyApi {

    private final CredentialManager credentialManager;
    private final Context context;

    public PasskeyApi(Context context) {
        this.context = context;
        this.credentialManager = CredentialManager.create(context);
    }

    public void createPasskey(String requestJson, PluginCall call) {
        Log.i("PasskeyApi.createPasskey", requestJson);

        CreatePublicKeyCredentialRequest createRequest = new CreatePublicKeyCredentialRequest(
            requestJson, // JSON WebAuthn CreateOptions
            null, // clientDataHash (optional)
            true, // preferImmediatelyAvailableCredentials
            null, // origin (optional, typically null in apps)
            false, // isAutoSelectAllowed
            false // isConditional
        );

        CancellationSignal cancellationSignal = new CancellationSignal();
        Executor executor = ContextCompat.getMainExecutor(this.context);

        credentialManager.createCredentialAsync(
            this.context,
            createRequest,
            cancellationSignal,
            executor,
            new CredentialManagerCallback<CreateCredentialResponse, CreateCredentialException>() {
                @Override
                public void onResult(CreateCredentialResponse response) {
                    if (response instanceof CreatePublicKeyCredentialResponse) {
                        try {
                            CreatePublicKeyCredentialResponse pubKeyResponse = (CreatePublicKeyCredentialResponse) response;
                            String registrationJson = pubKeyResponse.getRegistrationResponseJson();
                            Log.i("PasskeyApi.createPasskey - responseJson:", registrationJson);
                            JSONObject json = new JSONObject(registrationJson);
                            JSObject result = JSObject.fromJSONObject(json);

                            call.resolve(result);
                        } catch (JSONException e) {
                            call.reject("PasskeyApi.createPasskey", "Failed to parse credential response: ", e);
                        }
                    } else {
                        call.reject("PasskeyApi.createPasskey", "Unexpected credential type: " + response.getClass().getName());
                    }
                }

                @Override
                public void onError(CreateCredentialException e) {
                    call.reject("PasskeyApi.createPasskey", "Credential creation failed", e);
                }
            }
        );
    }

    public JSObject authenticateWithPasskey(String requestJson, PluginCall call) {
        Log.i("PasskeyApi.authenticateWithPasskey", requestJson);

        GetPublicKeyCredentialOption publicKeyCredentialOption = new GetPublicKeyCredentialOption(
            requestJson, // WebAuthnRequestOptions JSON
            null, // clientDataHash (optional)
            Collections.emptySet()
        );

        GetCredentialRequest getRequest = new GetCredentialRequest.Builder().addCredentialOption(publicKeyCredentialOption).build();

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
                        try {
                            androidx.credentials.PublicKeyCredential credential =
                                (androidx.credentials.PublicKeyCredential) response.getCredential();
                            String credentialJson = credential.getAuthenticationResponseJson();
                            Log.i("PasskeyApi.authenticateWithPasskey - Received credential: ", credentialJson);
                            JSONObject json = new JSONObject(credentialJson);
                            JSObject result = JSObject.fromJSONObject(json);

                            call.resolve(result);
                        } catch (JSONException e) {
                            call.reject("Failed to parse credential response: " + e.getMessage());
                        }
                    } else {
                        call.reject("PasskeyApi.authenticateWithPasskey", "Nicht unterstützter Credential-Typ");
                    }
                }

                @Override
                public void onError(GetCredentialException e) {
                    call.reject("PasskeyApi.authenticateWithPasskey", "Error while authentication with passkey:", e);
                }
            }
        );

        JSObject result = new JSObject();
        return result;
    }
}
