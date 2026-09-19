package com.mbari.app

import android.os.CancellationSignal
import android.util.Base64
import androidx.core.content.ContextCompat
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.CredentialManagerCallback
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.ClearCredentialException
import androidx.credentials.exceptions.GetCredentialCancellationException
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException
import java.security.SecureRandom

/**
 * Sign in with Google via Credential Manager, the current Android API (the
 * legacy Google Sign-In SDK is deprecated). Only the ID token leaves the
 * phone: the backend verifies it with Better Auth and issues the session.
 */
class GoogleSignInModule(reactContext: ReactApplicationContext) :
  NativeGoogleSignInSpec(reactContext) {

  private val credentialManager by lazy { CredentialManager.create(reactApplicationContext) }

  override fun getName() = NAME

  override fun signIn(webClientId: String, promise: Promise) {
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      promise.reject("failed", "Sign-in needs the app in the foreground.")
      return
    }
    if (webClientId.isBlank()) {
      promise.reject("not_configured", "Google sign-in has no web client ID for this build.")
      return
    }

    val nonce = newNonce()
    // The explicit "Continue with Google" button flow: every account on the
    // device, with Google's consent step for a first sign-in.
    val option = GetSignInWithGoogleOption.Builder(webClientId).setNonce(nonce).build()
    val request = GetCredentialRequest.Builder().addCredentialOption(option).build()

    credentialManager.getCredentialAsync(
      activity,
      request,
      CancellationSignal(),
      ContextCompat.getMainExecutor(activity),
      object : CredentialManagerCallback<GetCredentialResponse, GetCredentialException> {
        override fun onResult(result: GetCredentialResponse) {
          val credential = result.credential
          if (credential !is CustomCredential ||
            credential.type != GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
          ) {
            promise.reject("failed", "Google returned an unexpected credential type.")
            return
          }
          try {
            val google = GoogleIdTokenCredential.createFrom(credential.data)
            promise.resolve(
              Arguments.createMap().apply {
                putString("idToken", google.idToken)
                putString("nonce", nonce)
              },
            )
          } catch (e: GoogleIdTokenParsingException) {
            promise.reject("failed", "Google returned an unreadable ID token.", e)
          }
        }

        override fun onError(e: GetCredentialException) {
          when (e) {
            is GetCredentialCancellationException -> promise.reject("cancelled", "Sign-in was cancelled.", e)
            is NoCredentialException -> promise.reject("no_credential", "No Google account is available on this device.", e)
            else -> promise.reject("failed", e.message ?: "Google sign-in failed.", e)
          }
        }
      },
    )
  }

  override fun signOut(promise: Promise) {
    credentialManager.clearCredentialStateAsync(
      ClearCredentialStateRequest(),
      CancellationSignal(),
      ContextCompat.getMainExecutor(reactApplicationContext),
      object : CredentialManagerCallback<Void?, ClearCredentialException> {
        override fun onResult(result: Void?) {
          promise.resolve(null)
        }

        override fun onError(e: ClearCredentialException) {
          // Signing out of the app must not depend on this succeeding.
          promise.resolve(null)
        }
      },
    )
  }

  /** Random, URL-safe; Google bakes it into the ID token to tie the token to this request. */
  private fun newNonce(): String {
    val bytes = ByteArray(32).also { SecureRandom().nextBytes(it) }
    return Base64.encodeToString(bytes, Base64.NO_WRAP or Base64.URL_SAFE or Base64.NO_PADDING)
  }

  companion object {
    const val NAME = "NativeGoogleSignIn"
  }
}
