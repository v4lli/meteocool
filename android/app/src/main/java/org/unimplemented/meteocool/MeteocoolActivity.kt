package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.WebView

import org.unimplemented.meteocool.security.Validator
import com.google.firebase.iid.FirebaseInstanceId
import org.jetbrains.anko.doAsync
import org.unimplemented.meteocool.location.WebAppInterface
<<<<<<< HEAD:android/app/src/main/java/org/unimplemented/meteocool/MeteocoolActivity.kt
import org.unimplemented.meteocool.onboarding.Onboarding
=======
import org.unimplemented.meteocool.onboarding.OnboardingActivity
>>>>>>> 8cdadb84ad6d3f1a1935ddb58a80f31d72ac70fb:android/app/src/main/java/org/unimplemented/meteocool/Meteocool.kt
import org.unimplemented.meteocool.utility.JSONClearPost
import org.unimplemented.meteocool.utility.NetworkUtility
import org.unimplemented.meteocool.service.UploadLocationService


class MeteocoolActivity : AppCompatActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        PreferenceManager.getDefaultSharedPreferences(this).apply {
<<<<<<< HEAD:android/app/src/main/java/org/unimplemented/meteocool/MeteocoolActivity.kt
            // Check if we need to display our OnboardingFragment
            if (!getBoolean(Onboarding.IS_ONBOARD_COMPLETED, false)) {
                // The user hasn't seen the OnboardingFragment yet, so show it
                startActivity(Intent(this@MeteocoolActivity, Onboarding::class.java))
=======
            if (!getBoolean(OnboardingActivity.IS_ONBOARD_COMPLETED, false)) {
                startActivity(Intent(this@Meteocool, OnboardingActivity::class.java))
>>>>>>> 8cdadb84ad6d3f1a1935ddb58a80f31d72ac70fb:android/app/src/main/java/org/unimplemented/meteocool/Meteocool.kt
            }
        }
        setContentView(R.layout.activity_meteocool)
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, MapFragment()).commit()

        Validator.checkAndroidPermissions(this.applicationContext, this)

        Intent(this, UploadLocationService::class.java).also { intent ->
            startService(intent)
        }

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
                NetworkUtility.sendClearPostRequest(
                    JSONClearPost(
                        token,
                        "backend"
                    )
                )
            }
        }
    }
}



