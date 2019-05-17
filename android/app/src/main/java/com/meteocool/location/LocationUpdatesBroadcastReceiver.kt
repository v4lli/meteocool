package com.meteocool.location

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.net.Network
import android.util.Log
import android.widget.Toast
import com.google.android.gms.location.LocationResult
import com.meteocool.utility.NetworkUtility

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
                    //UploadLocation().execute(result.lastLocation)
                    //Toast.makeText(, "$result", Toast.LENGTH_SHORT).show()
                    val location = result.lastLocation
                    val locationResultHelper = LocationResultHelper(
                        context, location)

                    locationResultHelper.showLocationViaToast()

//                    val locations = result.locations
//                    val locationResultHelper = LocationResultHelper(
//                        context!!, locations
//                    )
//                    // Save the location data to SharedPreferences.
//                    locationResultHelper.saveResults()
//                    // Show notification with the location data.
//                    //locationResultHelper.showNotification()
//                    Log.i(TAG, LocationResultHelper.getSavedLocationResult(context))
                }
            }
        }
    }

}
