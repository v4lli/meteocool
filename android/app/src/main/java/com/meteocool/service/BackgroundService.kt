package com.meteocool.service

import android.Manifest
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Bundle
import android.os.IBinder
import android.preference.PreferenceManager
import android.support.v4.app.JobIntentService
import android.support.v4.content.ContextCompat
import android.util.Log
import android.widget.Toast
import com.meteocool.location.UploadLocation

class BackgroundService : JobIntentService(){

    companion object{
        const val JOB_ID = 1000

        private const val MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS : Long = 1000 * 60 * 5 // 1000 * 60 * 60 * 5
        private const val PASSIVE_MIN_TIME_INTERVAL : Long = 1000 * 60 * 5
        private const val MIN_DISTANCE_LOCATION_UPDATE_METER : Float = 500f
        private const val TWO_MINUTES: Long = 1000 * 60 * 2

        fun enqueueWork(context: Context, work: Intent) {
            enqueueWork(context, BackgroundService::class.java, JOB_ID, work)
        }

    }


    override fun onHandleWork(p0: Intent) {
        val locationManager = getSystemService(Service.LOCATION_SERVICE) as (LocationManager)

        if(ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            )== PackageManager.PERMISSION_GRANTED && locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)){
            val lastLocation =  locationManager.getLastKnownLocation(LocationManager.PASSIVE_PROVIDER)
            if(lastLocation == null){

            }else {
                Log.d("Location Background", "Check")
                Log.d("Location", lastLocation.toString())
                UploadLocation().execute(lastLocation)
                val preferenceManager = PreferenceManager.getDefaultSharedPreferences(this)
                preferenceManager.edit().putFloat("latitude", lastLocation.latitude.toFloat()).apply()
                preferenceManager.edit().putFloat("longitude", lastLocation.longitude.toFloat()).apply()
                preferenceManager.edit().putFloat("accuracy", lastLocation.accuracy).apply()
            }
        }
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
        val isSignificantlyNewer: Boolean = timeDelta > BackgroundService.TWO_MINUTES
        val isSignificantlyOlder:Boolean = timeDelta < -BackgroundService.TWO_MINUTES

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
}