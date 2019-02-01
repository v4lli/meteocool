package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.WebView

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build



class Meteocool : AppCompatActivity() {

    companion object {
       const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val myWebView = WebView(this)
        val webSettings = myWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        setContentView(myWebView)
        myWebView.loadUrl("https://meteocool.unimplemented.org/?mobile=android")

        var preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create channel to show notifications.
            val channelId = getString(R.string.notifications_admin_channel_id)
            val channelName = getString(R.string.notifications_admin_channel_name)
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(NotificationChannel(channelId,
                channelName, NotificationManager.IMPORTANCE_LOW))
        }
    }
}
