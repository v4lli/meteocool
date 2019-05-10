package com.meteocool.service

import android.preference.PreferenceManager
import android.util.Log
import com.google.firebase.iid.FirebaseInstanceId
import com.google.firebase.iid.FirebaseInstanceIdService

class MyFirebaseInstanceIDService : FirebaseInstanceIdService() {

    override fun onTokenRefresh() {
        // Get updated InstanceID token.
        val refreshedToken = FirebaseInstanceId.getInstance().token
        Log.d(TAG, "Refreshed token: " + refreshedToken!!)
        // If you want to send messages to this application instance or
        //        // manage this apps subscriptions on the server side, send the
        //        // Instance ID token to your app server.
        val preferences = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        preferences.edit().putString("FIREBASE_TOKEN", refreshedToken).apply()
    }

    companion object {
        private const val TAG = "MyFirebaseIDService"
    }
}
