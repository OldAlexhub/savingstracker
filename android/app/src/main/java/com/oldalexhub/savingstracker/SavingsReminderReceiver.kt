package com.oldalexhub.savingstracker

import android.Manifest
import android.app.AlarmManager
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.util.Calendar

class SavingsReminderReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val goalId = intent.getStringExtra(EXTRA_GOAL_ID) ?: return
    val title = intent.getStringExtra(EXTRA_TITLE) ?: "Savings reminder"
    val message = intent.getStringExtra(EXTRA_MESSAGE) ?: "Log a savings contribution when you can."
    val frequency = intent.getStringExtra(EXTRA_FREQUENCY) ?: "weekly"

    createNotificationChannel(context)

    if (
      Build.VERSION.SDK_INT < 33 ||
      context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    ) {
      val openIntent =
        context.packageManager.getLaunchIntentForPackage(context.packageName) ?: Intent()
      val contentIntent = PendingIntent.getActivity(
        context,
        goalId.hashCode(),
        openIntent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )

      val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.mipmap.ic_launcher)
        .setContentTitle(title)
        .setContentText(message)
        .setStyle(NotificationCompat.BigTextStyle().bigText(message))
        .setContentIntent(contentIntent)
        .setAutoCancel(true)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()

      NotificationManagerCompat.from(context).notify(goalId.hashCode(), notification)
    }

    scheduleNext(context, goalId, title, message, frequency)
  }

  private fun scheduleNext(
    context: Context,
    goalId: String,
    title: String,
    message: String,
    frequency: String
  ) {
    val next = Calendar.getInstance()
    when (frequency) {
      "daily" -> next.add(Calendar.DAY_OF_YEAR, 1)
      "monthly" -> next.add(Calendar.MONTH, 1)
      else -> next.add(Calendar.DAY_OF_YEAR, 7)
    }

    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val nextIntent = Intent(context, SavingsReminderReceiver::class.java).apply {
      putExtra(EXTRA_GOAL_ID, goalId)
      putExtra(EXTRA_TITLE, title)
      putExtra(EXTRA_MESSAGE, message)
      putExtra(EXTRA_FREQUENCY, frequency)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      goalId.hashCode(),
      nextIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next.timeInMillis, pendingIntent)
  }

  private fun createNotificationChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Savings reminders",
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "Optional reminders for local savings goals"
    }
    val manager = context.getSystemService(NotificationManager::class.java)
    manager.createNotificationChannel(channel)
  }

  companion object {
    const val CHANNEL_ID = "savings_goal_reminders"
    const val EXTRA_GOAL_ID = "goalId"
    const val EXTRA_TITLE = "title"
    const val EXTRA_MESSAGE = "message"
    const val EXTRA_FREQUENCY = "frequency"
  }
}
