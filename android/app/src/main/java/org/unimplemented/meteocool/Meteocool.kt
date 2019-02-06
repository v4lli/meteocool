package org.unimplemented.meteocool

import android.Manifest
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.preference.PreferenceManager
import android.util.Log

import org.unimplemented.meteocool.security.Validator
import android.content.pm.PackageManager
import android.location.LocationManager
import android.support.v4.content.ContextCompat
import android.location.Criteria
import com.google.firebase.iid.FirebaseInstanceId
import org.unimplemented.meteocool.service.UploadLocationService


class Meteocool : AppCompatActivity() {

    companion object {
       private const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Validator.checkAndroidPermissions(this.applicationContext, this)
        val myWebView = WebView(this)
        val webSettings = myWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        setContentView(myWebView)

        val mService = Intent(this, UploadLocationService::class.java).also { intent ->
            startService(intent)
        }

        val preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))
        //Log.d("Preferences", FirebaseInstanceId.getInstance().token) --> Causes error on first installation


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create channel to show notifications.
            val channelId = getString(R.string.notifications_admin_channel_id)
            val channelName = getString(R.string.notifications_admin_channel_name)
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(NotificationChannel(channelId,
                channelName, NotificationManager.IMPORTANCE_LOW))
        }

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.cancelAll()

        myWebView.loadUrl(WEB_URL)
    }

    override fun onResume() {
        super.onResume()

    }
}



