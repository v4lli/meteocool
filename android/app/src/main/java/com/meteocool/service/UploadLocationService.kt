package com.meteocool.service

import android.Manifest
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.IBinder
import android.preference.PreferenceManager
import android.support.v4.content.ContextCompat
import android.util.Log
import android.widget.Toast
import com.meteocool.location.UploadLocation

class UploadLocationService : Service(){

    companion object {
        private const val MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS : Long = 1000 * 60 * 60 * 5
        private const val PASSIVE_MIN_TIME_INTERVAL : Long = 1000 * 60 * 5
        private const val MIN_DISTANCE_LOCATION_UPDATE_METER : Float = 500f
        private const val TWO_MINUTES: Long = 1000 * 60 * 2
        private const val BROADCAST_ACTION = "UploadLocationService start"
    }

    private var intent : Intent? = null

    /**
     * Will be called when service starts
     */
    override fun onCreate() {
        super.onCreate()
        Log.d("UploadLocationService", "Created")
        intent = Intent(BROADCAST_ACTION)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        super.onStartCommand(intent, flags, startId)
        Log.e("UploadLocationService", "onStartCommand")

        val locationManager = getSystemService(LOCATION_SERVICE) as (LocationManager)
        val locationListener = MyLocationListener()

        Log.e("UploadLocationService", "afterListener")


        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            return START_NOT_STICKY
        }

        locationManager.requestLocationUpdates(LocationManager.PASSIVE_PROVIDER,
            PASSIVE_MIN_TIME_INTERVAL,
            MIN_DISTANCE_LOCATION_UPDATE_METER, locationListener)

        locationManager.requestLocationUpdates(
            LocationManager.NETWORK_PROVIDER,
            MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS,
            MIN_DISTANCE_LOCATION_UPDATE_METER, locationListener)

        locationManager.requestLocationUpdates(
            LocationManager.GPS_PROVIDER,
            MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS,
            MIN_DISTANCE_LOCATION_UPDATE_METER, locationListener)

        Log.d("UploadLocationService", "Update requested in onStartCommand")
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }


    /** Determines whether one Location reading is better than the current Location fix
     * @param location The new Location that you want to evaluate
     * @param currentBestLocation The current Location fix, to which you want to compare the new one
     */
    private fun isBetterLocation(location: Location, currentBestLocation: Location?): Boolean {
        Log.d("UploadLocationService", "Current best location: ${currentBestLocation?.longitude}/${currentBestLocation?.latitude}")
        Log.d("UploadLocationService", "New location : ${location.longitude}/${location.latitude}")
        if (currentBestLocation == null) {
            // A new location is always better than no location
            return true
        }

        // Check whether the new location fix is newer or older
        val timeDelta: Long = location.time - currentBestLocation.time
        val isSignificantlyNewer: Boolean = timeDelta > TWO_MINUTES
        val isSignificantlyOlder:Boolean = timeDelta < -TWO_MINUTES

        when {
            // If it's been more than two minutes since the current location, use the new location
            // because the user has likely moved
            isSignificantlyNewer -> {
                Log.d("UploadLocationService", "Time is newer")
                return true
            }
            // If the new location is more than two minutes older, it must be worse
            isSignificantlyOlder -> {
                Log.d("UploadLocationService", "Time is older")
                return false
            }
        }

        // Check whether the new location fix is more or less accurate
        val isNewer: Boolean = timeDelta > 0L
        val accuracyDelta: Float = location.accuracy - currentBestLocation.accuracy
        val isLessAccurate: Boolean = accuracyDelta > 0f
        val isMoreAccurate: Boolean = accuracyDelta < 0f
        val isSignificantlyLessAccurate: Boolean = accuracyDelta > 200f

        // Check if the old and new location are from the same provider
        val isFromSameProvider: Boolean = location.provider == currentBestLocation.provider

        // Determine location quality using a combination of timeliness and accuracy
        return when {
            isMoreAccurate -> true
            isNewer && !isLessAccurate -> true
            isNewer && !isSignificantlyLessAccurate && isFromSameProvider -> true
            else -> false
        }
    }

    inner class MyLocationListener() : LocationListener {
        private var lastKnownLocation : Location? = null
        override fun onLocationChanged(location: Location) {
            Log.d("LocationListener", "$location changed")
            storeInPreference(location)
            if (isBetterLocation(location, lastKnownLocation) ) {
                Log.d("LocationListener", "${location.longitude}/${location.latitude} is better")
                UploadLocation().execute(location)
                sendBroadcast(intent)
                lastKnownLocation = location
                Log.d("LocationListener", "Location successfully pushed")
            }else{
                Log.d("LocationListener", "${location.longitude}/${location.latitude} is not better")
            }
        }

        override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
            Log.d("LocationListener", "$provider onStatusChanged")
        }

        override fun onProviderEnabled(provider: String?) {
            Log.d("LocationListener", "$provider onEnabled")
            Toast.makeText(applicationContext, "Gps Enabled", Toast.LENGTH_SHORT ).show()
        }

        override fun onProviderDisabled(provider: String?) {
            Log.d("LocationListener", "$provider onDisabled")
            Toast.makeText(applicationContext, "Gps Disabled", Toast.LENGTH_SHORT ).show()
        }

        /**
         * Store latitude, longitude and accuracy in preferences for later use.
         * @param location used for storing latitude, longitude and accuracy in preferences
         */
        private fun storeInPreference(location : Location){
            val preferenceManager = PreferenceManager.getDefaultSharedPreferences(applicationContext)
            preferenceManager.edit()
                .putFloat("latitude", location.latitude.toFloat())
                .putFloat("longitude", location.longitude.toFloat())
                .putFloat("accuracy", location.accuracy.toFloat())
                .apply()
        }
    }
}
