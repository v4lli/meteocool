package com.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.WebView

import com.meteocool.security.Validator
import com.google.firebase.iid.FirebaseInstanceId
import org.jetbrains.anko.doAsync
import com.meteocool.location.WebAppInterface

import com.meteocool.onboarding.OnboardingActivity
import com.meteocool.utility.JSONClearPost
import com.meteocool.utility.NetworkUtility
import com.meteocool.service.UploadLocationService
import org.jetbrains.anko.support.v4.startService


class MeteocoolActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)


        if(!isOnboardingCompleted()) {
            startActivity(Intent(this@MeteocoolActivity, OnboardingActivity::class.java))
        }else{
            Validator.checkAndroidPermissions(this.applicationContext, this)
        }

        setContentView(R.layout.activity_meteocool)
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, MapFragment()).commit()

        /*Intent(this, UploadLocationService::class.java).also { intent ->
            startService(intent)
        }*/

        val preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))

        cancelNotifications()

    }



    override fun onStart() {
        super.onStart()
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



