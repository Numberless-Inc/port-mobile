package tech.numberless.port

import android.content.Context
import android.content.SharedPreferences
import tech.numberless.port.specs.NativeEncryptedStorageSpec
import com.facebook.react.bridge.ReactApplicationContext
import android.util.Log;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

class NativeEncryptedStorageModule(reactContext: ReactApplicationContext) : NativeEncryptedStorageSpec(reactContext) {
  companion object {
    val NATIVE_MODULE_NAME = "RNEncryptedStorage"
    val SHARED_PREFERENCES_FILENAME = "RN_ENCRYPTED_STORAGE_SHARED_PREF"
    const val NAME = "NativeEncryptedStorage"
  }

  private var sharedPreferences: SharedPreferences? = null

  private fun initSharedPreferences() {
    if (null != this.sharedPreferences){
      return
    }
    try {
      val key = MasterKey.Builder(reactApplicationContext)
          .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
          .build()

      this.sharedPreferences = EncryptedSharedPreferences.create(
          reactApplicationContext,
          SHARED_PREFERENCES_FILENAME,
          key,
          EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
          EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
      )
    } catch (ex: Exception) {
        Log.e(NATIVE_MODULE_NAME, "Failed to create encrypted shared preferences! Failing back to standard SharedPreferences", ex)
        this.sharedPreferences = reactApplicationContext.getSharedPreferences(SHARED_PREFERENCES_FILENAME, Context.MODE_PRIVATE)
    }
  }

  override fun getName() = NAME

  override fun setItem(key: String, value: String) {
    initSharedPreferences()
    val editor = this.sharedPreferences!!.edit()
    editor.putString(key, value)
    if(!editor.commit()){
      throw RuntimeException("Could not commit value to save")
    }

  }

  override fun getItem(key: String): String? {
    initSharedPreferences()
    return this.sharedPreferences!!.getString(key, null).toString();
  }


  override fun clear() {
    val editor = this.sharedPreferences!!.edit();
    editor.clear()
    editor.apply()
  }
}