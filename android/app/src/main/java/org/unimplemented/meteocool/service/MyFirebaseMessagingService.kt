package org.unimplemented.meteocool.service

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.app.NotificationManager
import android.content.Context
import android.media.RingtoneManager
import android.support.v4.app.NotificationCompat
import android.app.NotificationChannel
import android.app.PendingIntent
import android.content.Intent
import android.os.Build
import org.unimplemented.meteocool.Meteocool
import org.unimplemented.meteocool.R
import java.util.*


class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage?) {

        Log.d(TAG, "From: " + remoteMessage!!.from!!)
        Log.d(TAG, "Notification Message Body: " + remoteMessage.data!!["clear_all"]!!)

        if(remoteMessage.data!!["clear_all"]!! == "true") {
            cancelNotification()
        }
    }

    private fun cancelNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
    }

    companion object {
        private const val TAG = "FCM Service"
    }
}