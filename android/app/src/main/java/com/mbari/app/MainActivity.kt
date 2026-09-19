package com.mbari.app

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // Before super.onCreate: the splash theme swaps to AppTheme here.
    val splash = installSplashScreen()
    LaunchScreen.reset()
    // Held until JavaScript has drawn its copy of the mark, so the hand-over
    // is invisible. Released anyway after a few seconds if JS never says so.
    splash.setKeepOnScreenCondition { !LaunchScreen.released }
    Handler(Looper.getMainLooper()).postDelayed({ LaunchScreen.release() }, LaunchScreen.TIMEOUT_MS)
    super.onCreate(savedInstanceState)
  }

  /**
   * Returns the name of the main component registered from JavaScript. This is used to schedule
   * rendering of the component.
   */
  override fun getMainComponentName(): String = "Mbari"

  /**
   * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
   * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
   */
  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
