package com.oldalexhub.savingstracker

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SavingsReminderModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "SavingsReminderModule"

  @ReactMethod
  fun scheduleReminder(
    goalId: String,
    title: String,
    message: String,
    timestamp: Double,
    frequency: String,
    promise: Promise
  ) {
    try {
      val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(reactContext, SavingsReminderReceiver::class.java).apply {
        putExtra(SavingsReminderReceiver.EXTRA_GOAL_ID, goalId)
        putExtra(SavingsReminderReceiver.EXTRA_TITLE, title)
        putExtra(SavingsReminderReceiver.EXTRA_MESSAGE, message)
        putExtra(SavingsReminderReceiver.EXTRA_FREQUENCY, frequency)
      }
      val pendingIntent = PendingIntent.getBroadcast(
        reactContext,
        goalId.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      alarmManager.setAndAllowWhileIdle(
        AlarmManager.RTC_WAKEUP,
        timestamp.toLong(),
        pendingIntent
      )
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SAVINGS_REMINDER_SCHEDULE_FAILED", error)
    }
  }

  @ReactMethod
  fun cancelReminder(goalId: String, promise: Promise) {
    try {
      val alarmManager = reactContext.getSystemService(Context.ALARM_SERVICE) as AlarmManager
      val intent = Intent(reactContext, SavingsReminderReceiver::class.java)
      val pendingIntent = PendingIntent.getBroadcast(
        reactContext,
        goalId.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
      alarmManager.cancel(pendingIntent)
      pendingIntent.cancel()
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("SAVINGS_REMINDER_CANCEL_FAILED", error)
    }
  }
}
