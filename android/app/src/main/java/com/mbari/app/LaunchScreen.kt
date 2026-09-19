package com.mbari.app

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider

/** Whether the native splash may go. Read by MainActivity's keep-on-screen condition. */
object LaunchScreen {
  /** A debug build loads JavaScript from Metro, which takes several seconds longer. */
  val TIMEOUT_MS = if (BuildConfig.DEBUG) 15_000L else 4_000L

  @Volatile
  var released = false
    private set

  fun release() {
    released = true
  }

  fun reset() {
    released = false
  }
}

/** JavaScript calls `hide()` once its launch screen is on screen. */
class LaunchScreenModule(reactContext: ReactApplicationContext) : NativeLaunchScreenSpec(reactContext) {
  override fun getName() = NAME

  override fun hide() {
    LaunchScreen.release()
  }

  companion object {
    const val NAME = "NativeLaunchScreen"
  }
}

/** Registers LaunchScreenModule; added by hand in MainApplication. */
class LaunchScreenPackage : BaseReactPackage() {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
    if (name == LaunchScreenModule.NAME) LaunchScreenModule(reactContext) else null

  override fun getReactModuleInfoProvider() = ReactModuleInfoProvider {
    mapOf(
      LaunchScreenModule.NAME to ReactModuleInfo(
        name = LaunchScreenModule.NAME,
        className = LaunchScreenModule.NAME,
        canOverrideExistingModule = false,
        needsEagerInit = false,
        isCxxModule = false,
        isTurboModule = true,
      ),
    )
  }
}
