package com.meteocool.service

import android.util.Log
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import android.app.NotificationManager
import android.content.Context
import com.google.firebase.iid.FirebaseInstanceId
import com.meteocool.utility.JSONClearPost
import com.meteocool.utility.NetworkUtility
import org.jetbrains.anko.defaultSharedPreferences


class MyFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(p0: String) {
        super.onNewToken(p0)
        defaultSharedPreferences.edit().putString("fb", p0).apply()
    }

    override fun onMessageReceived(remoteMessage: RemoteMessage?) {

        if(remoteMessage != null) {
            Log.d(TAG, "From: " + remoteMessage.from!!)
            Log.d(TAG, "Notification Message Body: " + remoteMessage.data["clear_all"])

            if (remoteMessage.data["clear_all"] == "true") {
                cancelNotification()
            }
        }
    }

    private fun cancelNotification() {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()
        val token =  defaultSharedPreferences.getString("fb", "no token")!!
        NetworkUtility.sendPostRequest(
            JSONClearPost(
                token,
                "background"
            ), NetworkUtility.POST_CLEAR_NOTIFICATION
        )
    }

    companion object {
        private const val TAG = "FCM Service"
    }
}
