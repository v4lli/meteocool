package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle

import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.preference.PreferenceManager
import android.util.Log

import org.unimplemented.meteocool.security.Validator
import com.google.firebase.iid.FirebaseInstanceId
import org.jetbrains.anko.doAsync
import org.unimplemented.meteocool.utility.JSONClearPost
import org.unimplemented.meteocool.utility.NetworkUtility
import org.unimplemented.meteocool.service.UploadLocationService


class Meteocool : AppCompatActivity() {



    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_meteocool)
        Validator.checkAndroidPermissions(this.applicationContext, this)

        val mService = Intent(this, UploadLocationService::class.java).also { intent ->
            startService(intent)
        }

        val preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))


//        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
//            // Create channel to show notifications.
//            val channelId = getString(R.string.notifications_admin_channel_id)
//            val channelName = getString(R.string.notifications_admin_channel_name)
//            val notificationManager = getSystemService(NotificationManager::class.java)
//            notificationManager?.createNotificationChannel(NotificationChannel(channelId,
//                channelName, NotificationManager.IMPORTANCE_LOW))
//        }

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
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, MapFragment()).commit()

    }



    override fun onResume() {
        super.onResume()

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



