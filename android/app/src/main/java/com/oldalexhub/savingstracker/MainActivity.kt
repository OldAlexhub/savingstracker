package com.oldalexhub.savingstracker

import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    // React Navigation owns the stack; Android fragment restoration would
    // duplicate react-native-screens fragments after theme/process recreation.
    super.onCreate(null)
  }

  override fun getMainComponentName(): String = "savingstracker"

  override fun createReactActivityDelegate(): ReactActivityDelegate =
      DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
