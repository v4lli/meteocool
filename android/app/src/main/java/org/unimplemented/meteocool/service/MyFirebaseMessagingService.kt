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
import com.google.firebase.iid.FirebaseInstanceId
import org.unimplemented.meteocool.Meteocool
import org.unimplemented.meteocool.R
import org.unimplemented.meteocool.utility.JSONClearPost
import org.unimplemented.meteocool.utility.JSONPost
import org.unimplemented.meteocool.utility.NetworkUtility
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
        var token =  FirebaseInstanceId.getInstance().token
        if(token==null) {token = "no token"}
        NetworkUtility.sendClearPostRequest(
            JSONClearPost(
                token,
                "backend"
            )
        )
    }

    companion object {
        private const val TAG = "FCM Service"
    }
}