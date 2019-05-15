package com.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.WebView

import com.google.firebase.iid.FirebaseInstanceId
import org.jetbrains.anko.doAsync
import com.meteocool.location.WebAppInterface

import com.meteocool.onboarding.OnboardingActivity
import com.meteocool.service.BackgroundService
import com.meteocool.service.UploadLocationService
import com.meteocool.utility.JSONClearPost
import com.meteocool.utility.NetworkUtility


class MeteocoolActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)


        if(!isOnboardingCompleted()) {
            startActivity(Intent(this@MeteocoolActivity, OnboardingActivity::class.java))
        }

        Intent(this, UploadLocationService::class.java).also { intent ->
            startService(intent)
        }

        setContentView(R.layout.activity_meteocool)
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, MapFragment()).commit()

        val preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))

        cancelNotifications()
    }



    override fun onStart() {
        super.onStart()
        val myIntent = Intent(this, BackgroundService::class.java)
        BackgroundService.enqueueWork(this, myIntent)
//        val locationManager = getSystemService(Service.LOCATION_SERVICE) as (LocationManager)
//        if(ContextCompat.checkSelfPermission(
//                this,
//                Manifest.permission.ACCESS_FINE_LOCATION
//            )== PackageManager.PERMISSION_GRANTED && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)){
//            val lastLocation =  locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
//            Log.d("Location", lastLocation.toString())
//            UploadLocation().execute(lastLocation)
//            val preferenceManager = PreferenceManager.getDefaultSharedPreferences(this)
//            preferenceManager.edit().putFloat("latitude", lastLocation.latitude.toFloat()).apply()
//            preferenceManager.edit().putFloat("longitude", lastLocation.longitude.toFloat()).apply()
//            preferenceManager.edit().putFloat("accuracy", lastLocation.accuracy).apply()
//        }
        val mWebView : WebView = findViewById(R.id.webView)
        mWebView.addJavascriptInterface(WebAppInterface(this, mWebView), "Android")
    }

    override fun onResume() {
        super.onResume()
        cancelNotifications()
    }

    private fun cancelNotifications(){
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if(notificationManager.activeNotifications.isNotEmpty()) {
            notificationManager.cancelAll()
            var token = FirebaseInstanceId.getInstance().token
            if (token == null) {
                token = "no token"
            }
            doAsync {
                NetworkUtility.sendPostRequest(
                    JSONClearPost(
                        token,
                        "backend"
                    ),
                    NetworkUtility.CLEAR_URL
                )
            }
        }
    }

    private fun isOnboardingCompleted() : Boolean {
        return PreferenceManager.getDefaultSharedPreferences(this).getBoolean(OnboardingActivity.IS_ONBOARD_COMPLETED, false)
    }
}



