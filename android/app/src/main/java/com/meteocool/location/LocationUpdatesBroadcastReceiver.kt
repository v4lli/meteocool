package com.meteocool.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.location.Location
import android.util.Log
import com.google.android.gms.location.LocationResult
import java.math.BigDecimal
import java.math.RoundingMode

class LocationUpdatesBroadcastReceiver : BroadcastReceiver(){

    companion object {
        private const val TAG = "LUBroadcastReceiver"
        internal const val ACTION_PROCESS_UPDATES = "com.meteocool.backgroundlocationupdates.action" + ".PROCESS_UPDATES"
    }



    override fun onReceive(context: Context, intent: Intent?) {
        if (intent != null) {
            val action = intent.action
            if (ACTION_PROCESS_UPDATES == action) {
                val result = LocationResult.extractResult(intent)
                if (result != null) {

                    val location = result.lastLocation
                    val lastLocation = LocationResultHelper.getSavedLocationResult(context)
                        if(lastLocation[0] != location.latitude.toFloat() && lastLocation[1] != location.latitude.toFloat()){
                            Log.i("Location", "$location is better than $lastLocation")
                            UploadLocation().execute(location)
                        }else{
                            Log.i("Location", "$location is not better than $lastLocation")
                        }
                    val locationResultHelper = LocationResultHelper(context, location)
                    // Save the location data to SharedPreferences.
                    locationResultHelper.saveResults()
                    Log.i(TAG, LocationResultHelper.getSavedLocationResult(context).toString())
                }
            }
        }
    }

}
