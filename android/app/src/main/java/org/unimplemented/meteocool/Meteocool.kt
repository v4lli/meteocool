package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import android.preference.PreferenceManager
import android.util.Log

import org.jetbrains.anko.doAsync
import org.unimplemented.meteocool.security.Validator
import org.unimplemented.meteocool.utility.JSONPost
import org.unimplemented.meteocool.utility.NetworkUtility


class Meteocool : AppCompatActivity() {

    companion object {
       const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
       const val REST_URL = "https://meteocool.unimplemented.org/post_location"
       const val PERMISSION_REQUEST_LOCATION = 0
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Validator.checkAndroidPermissions(this, this)
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
        myWebView.loadUrl(WEB_URL)
    }

    override fun onResume() {
        super.onResume()
        doAsync { NetworkUtility.sendPostRequest(
            JSONPost(1.0,
            1.0,
            1.1,
            1.1,
            1.0,
            123.0,
            1234.0,
            "anon",
            "ios",
            15,
            10)
        )} // currently for testing
    }
}

