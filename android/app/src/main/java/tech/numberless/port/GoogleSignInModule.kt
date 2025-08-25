package tech.numberless.port

import android.app.Activity
import android.content.Intent
import android.content.IntentSender
import android.util.Base64
import android.util.Log
import androidx.core.app.ActivityCompat.startIntentSenderForResult
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.google.android.gms.auth.api.identity.AuthorizationRequest
import com.google.android.gms.auth.api.identity.AuthorizationResult
import com.google.android.gms.auth.api.identity.Identity
import com.google.android.gms.common.api.Scope
import com.google.android.gms.tasks.Task
import com.google.api.services.drive.DriveScopes
import java.security.SecureRandom
import java.util.Arrays


const val CLIENT_ID: String = "109051401047-1l5istep8npg16h2chhrv3cdgc3nngna.apps.googleusercontent.com"
const val NONCE_LEN: Int = 32;
const val TAG: String = "GoogleSignIn"

class GoogleSignInModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {

    private var authPromise: Promise? = null
    private val REQUEST_CODE_GOOGLE_AUTH = 1001

    init {
        reactContext.addActivityEventListener(this)
    }

    override fun getName(): String {
        return "GoogleSignInModule"
    }

    private fun createNonce(): String {
        val nonceBuffer = ByteArray(NONCE_LEN)
        SecureRandom().nextBytes(nonceBuffer)
        return Base64.encodeToString(nonceBuffer, 0, 32, Base64.URL_SAFE or Base64.NO_WRAP)
    }

    @ReactMethod
    fun signIn(promise: Promise) {
        val currentActivity = currentActivity ?: run {
            promise.reject("NO_ACTIVITY", "Activity doesn't exist")
            return
        }

        this.authPromise = promise

        val requestedScopes = Arrays.asList<Scope>(Scope(DriveScopes.DRIVE_APPDATA))
        val authorizationRequest =
            AuthorizationRequest.builder().setRequestedScopes(requestedScopes).build()
        Identity.getAuthorizationClient(currentActivity)
            .authorize(authorizationRequest)
            .addOnSuccessListener { authorizationResult ->
                if (authorizationResult.hasResolution()) {
                    // Access needs to be granted by the user
                    val pendingIntent = authorizationResult.pendingIntent
                    try {
                        currentActivity.startIntentSenderForResult(
                            pendingIntent!!.intentSender,
                            REQUEST_CODE_GOOGLE_AUTH,
                            null,
                            0,
                            0,
                            0,
                            null
                        )
                    } catch (e: IntentSender.SendIntentException) {
                        Log.e(TAG, "Couldn't start Authorization UI: " + e.localizedMessage)
                    }
                } else {
                    // Access already granted, continue with user action
                    Log.d(TAG, "Already granted access")
                    authPromise!!.resolve(authorizationResult.accessToken)
                }
            }
            .addOnFailureListener { e -> authPromise!!.reject("could not authorize user " + e.localizedMessage) }
    }

    override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
        if (requestCode == REQUEST_CODE_GOOGLE_AUTH) {
            try {
                val authClient = Identity.getAuthorizationClient(activity)
                val authorizationResult: AuthorizationResult =
                    authClient.getAuthorizationResultFromIntent(data)
                Log.d(TAG, "Deferred access granted")
                authPromise!!.resolve(authorizationResult.accessToken)
            } catch (e: Exception) {
                Log.e(TAG, "Error processing authorization result: ${e.localizedMessage}")
                authPromise!!.reject("AUTH_ERROR", "Failed to process authorization: ${e.localizedMessage}")
            }
        }
    }

    override fun onNewIntent(p0: Intent) {
        // Don't need to do anything, we just need this to complete the implementation of the
        // abstract inherited class
    }
}