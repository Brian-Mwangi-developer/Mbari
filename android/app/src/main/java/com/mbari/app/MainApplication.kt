package com.mbari.app

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(GoogleSignInPackage())
          add(LaunchScreenPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Register res/font XML families so `fontFamily` + `fontWeight` resolve to
    // the real weight files instead of synthetic bold.
    ReactFontManager.getInstance().addCustomFont(this, "PlusJakartaSans", R.font.plus_jakarta_sans)
    ReactFontManager.getInstance().addCustomFont(this, "Newsreader", R.font.newsreader)
    ReactFontManager.getInstance().addCustomFont(this, "AtkinsonHyperlegible", R.font.atkinson_hyperlegible)
    createNotificationChannels()
    loadReactNative(this)
  }

  /**
   * Android 8+ drops notifications without a channel. The backend sends to
   * "alerts" (NOTIFY_ANDROID_CHANNEL_ID); people can silence it on its own in
   * system settings without turning off the app.
   */
  private fun createNotificationChannels() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val channel = NotificationChannel(
      "alerts",
      "Alerts",
      NotificationManager.IMPORTANCE_DEFAULT,
    ).apply {
      description = "News from the sources you follow, waiting for you to approve it."
    }
    getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
  }
}
