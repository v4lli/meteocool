package com.meteocool.location;


import android.content.Context
import android.location.Location
import android.preference.PreferenceManager
import android.util.Log

/**
 * Class to process location results.
 */
internal class LocationResultHelper(private val mContext: Context, private val mLocation: Location) {

    /**
     * Saves location result as a string to [android.content.SharedPreferences].
     */
    fun saveResults() {
        PreferenceManager.getDefaultSharedPreferences(mContext)
            .edit()
            .putFloat(KEY_LOCATION_UPDATES_RESULT_LAT, mLocation.latitude.toFloat())
            .putFloat(KEY_LOCATION_UPDATES_RESULT_LON,  mLocation.longitude.toFloat())
            .putFloat(KEY_LOCATION_UPDATES_RESULT_ACC, mLocation.accuracy)
            .apply()
    }

    companion object {

        private const val TAG = "LocationResultHelper"

        const val KEY_LOCATION_UPDATES_RESULT_LAT = "location-update-result-latitude"
        const val KEY_LOCATION_UPDATES_RESULT_LON = "location-update-result-longitude"
        const val KEY_LOCATION_UPDATES_RESULT_ACC = "location-update-result-accuracy"

        var NOTIFICATION_TIME = 15
        var NOTIFICATION_INTENSITY = 10


        /**
         * Fetches location results from [android.content.SharedPreferences].
         */
        fun getSavedLocationResult(context: Context): Map<String, Float> {
            return mapOf(Pair(KEY_LOCATION_UPDATES_RESULT_LAT, PreferenceManager.getDefaultSharedPreferences(context)
                .getFloat(KEY_LOCATION_UPDATES_RESULT_LAT, -1.0f)),
                Pair(KEY_LOCATION_UPDATES_RESULT_LON, PreferenceManager.getDefaultSharedPreferences(context).getFloat(KEY_LOCATION_UPDATES_RESULT_LON, -1.0f)),
                Pair(KEY_LOCATION_UPDATES_RESULT_ACC, PreferenceManager.getDefaultSharedPreferences(context).getFloat(KEY_LOCATION_UPDATES_RESULT_ACC, -1.0f)))
        }

        fun getDistanceToLastLocation(newLocation : Location, context: Context) : Float{
            val distance = FloatArray(1)
            Location.distanceBetween(newLocation.latitude, newLocation.longitude, getSavedLocationResult(context).getValue(KEY_LOCATION_UPDATES_RESULT_LAT).toDouble(), getSavedLocationResult(context).getValue(KEY_LOCATION_UPDATES_RESULT_LON).toDouble() , distance)
            Log.d(TAG, "Calculated distance: ${distance[0]}")
            return distance[0]
        }
    }
}
