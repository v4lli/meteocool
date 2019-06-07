package com.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle

import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.WebView
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.api.GoogleApiClient
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.firebase.FirebaseApp
import com.google.firebase.database.FirebaseDatabase

import com.google.firebase.iid.FirebaseInstanceId
import com.meteocool.location.LocationUpdatesBroadcastReceiver
import org.jetbrains.anko.doAsync
import com.meteocool.location.WebAppInterface

import com.meteocool.security.Validator
import com.meteocool.utility.JSONClearPost
import com.meteocool.utility.NetworkUtility


class MeteocoolActivity : AppCompatActivity(), GoogleApiClient.ConnectionCallbacks, GoogleApiClient.OnConnectionFailedListener{



    private val pendingIntent: PendingIntent
        get() {
            val intent = Intent(this, LocationUpdatesBroadcastReceiver::class.java)
            intent.action = LocationUpdatesBroadcastReceiver.ACTION_PROCESS_UPDATES
            return PendingIntent.getBroadcast(this, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT)
        }

    private var mLocationRequest: LocationRequest? = null

    /**
     * The entry point to Google Play Services.
     */
    private var mFusedLocationClient: FusedLocationProviderClient? = null



    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        if (FirebaseApp.getApps(this).isNotEmpty()) {
            FirebaseDatabase.getInstance().setPersistenceEnabled(true);
        }

        if(Validator.isLocationPermissionGranted(this)) {
            Log.d("Location", "Start Fused")
            mFusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
            createLocationRequest()
            requestLocationUpdates()
        }

        setContentView(R.layout.activity_meteocool)
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, MapFragment()).commit()
        cancelNotifications()
    }

    /**
     * Handles the Request Updates button and requests start of location updates.
     */
    private fun requestLocationUpdates() {
        try {
            Log.i(TAG, "Starting location updates")
            mFusedLocationClient!!.requestLocationUpdates(
                mLocationRequest, pendingIntent)

        } catch (e: SecurityException) {
            e.printStackTrace()
        }

    }

    override fun onStart() {
        super.onStart()
        if(Validator.isLocationPermissionGranted(this)) {
            requestLocationUpdates()
        }
        val mWebView : WebView = findViewById(R.id.webView)
        mWebView.addJavascriptInterface(WebAppInterface(this, mWebView), "Android")

        var token = FirebaseInstanceId.getInstance().token
        if (token == null) {
            token = "no token"
            return
        }
        doAsync {
            NetworkUtility.sendPostRequest(
                JSONClearPost(
                    token,
                    "foreground"
                ),
                NetworkUtility.CLEAR_URL
            )
        }
    }

    override fun onResume() {
        super.onResume()
        cancelNotifications()
    }

    override fun onConnected(p0: Bundle?) {
        Log.i(TAG, "GoogleApiClient connected")
    }

    override fun onConnectionSuspended(p0: Int) {
        val text = "Connection suspended"
        Log.w(TAG, "$text: Error code: $p0")
    }

    override fun onConnectionFailed(connectionResult: ConnectionResult) {
        val text = "Exception while connecting to Google Play services"
        Log.w(TAG, text + ": " + connectionResult.errorMessage)
    }


    private fun cancelNotifications(){
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if(notificationManager.activeNotifications.isNotEmpty()) {
            notificationManager.cancelAll()
            var token = FirebaseInstanceId.getInstance().token
            if (token == null) {
                token = "no token"
                return
            }
            doAsync {
                NetworkUtility.sendPostRequest(
                    JSONClearPost(
                        token,
                        "background"
                    ),
                    NetworkUtility.CLEAR_URL
                )
            }
        }
    }



    private fun createLocationRequest() {
        mLocationRequest = LocationRequest()

        mLocationRequest!!.interval = UPDATE_INTERVAL

        // Sets the fastest rate for active location updates. This interval is exact, and your
        // application will never receive updates faster than this value.
        mLocationRequest!!.fastestInterval = FASTEST_UPDATE_INTERVAL
        mLocationRequest!!.priority = LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY

        // Sets the maximum time when batched location updates are delivered. Updates may be
        // delivered sooner than this interval.
        mLocationRequest!!.maxWaitTime = MAX_WAIT_TIME
    }



    companion object{
        private val TAG = MeteocoolActivity::class.java.simpleName + "_location"

        /**
         * The desired interval for location updates. Inexact. Updates may be more or less frequent.
         */
        private const val UPDATE_INTERVAL : Long = 15 * 60 * 1000

        /**
         * The fastest rate for active location updates. Updates will never be more frequent
         * than this value, but they may be less frequent.
         */
        private const val FASTEST_UPDATE_INTERVAL : Long = 5 * 60 * 1000

        /**
         * The max time before batched results are delivered by location services. Results may be
         * delivered sooner than this interval.
         */
        private const val MAX_WAIT_TIME = UPDATE_INTERVAL
    }


}



