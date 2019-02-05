package org.unimplemented.meteocool

import android.Manifest
import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.preference.PreferenceManager
import android.util.Log

import org.unimplemented.meteocool.security.Validator
import android.content.pm.PackageManager
import android.location.LocationManager
import android.support.v4.content.ContextCompat
import android.location.Criteria
import org.unimplemented.meteocool.location.MyLocationListener


class Meteocool : AppCompatActivity() {

    companion object {
       const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
       const val REST_URL = "https://meteocool.unimplemented.org/post_location"
       const val PERMISSION_REQUEST_LOCATION = 0
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
        myWebView.loadUrl("https://meteocool.unimplemented.org/?mobile=android")

        //this.getSystemService(Context.LOCATION_SERVICE)
       // startService(Intent(this, MyLocationService::class.java))


        if (ContextCompat.checkSelfPermission(this,
                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            Log.d("Location", "Entered location block")
            val locationManager = this.getSystemService(Context.LOCATION_SERVICE) as LocationManager
            val locationListener = MyLocationListener()
            val criteria = Criteria()
            criteria.accuracy = Criteria.ACCURACY_COARSE
            criteria.powerRequirement = Criteria.POWER_LOW
            val bestProvider = locationManager.getBestProvider(criteria, true)
            locationManager
                .requestLocationUpdates(bestProvider, 5000, 10f, locationListener)
        }else{
            Log.d("Location", "Entered location block not")
        }

        val preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))


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
        /*doAsync { NetworkUtility.sendPostRequest(
            JSONPost(1.0,
            1.0,
            1.1,
            1.1f,
            1.0f,
            123.0,
            1234.0,
            "anon",
            "android",
            15,
            10)
        )} // currently for testing*/
    }
}



