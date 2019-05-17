package com.meteocool.location;


import android.app.NotificationManager
import android.content.Context
import android.location.Location
import android.preference.PreferenceManager
import android.widget.Toast

/**
 * Class to process location results.
 */
internal class LocationResultHelper(private val mContext: Context, private val mLocation: Location) {
    private var mNotificationManager: NotificationManager? = null

    fun showLocationViaToast(){
        Toast.makeText(mContext, "$mLocation", Toast.LENGTH_SHORT).show()
    }

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

        val KEY_LOCATION_UPDATES_RESULT_LAT = "location-update-result-latitude"
        val KEY_LOCATION_UPDATES_RESULT_LON = "location-update-result-longitude"
        val KEY_LOCATION_UPDATES_RESULT_ACC = "location-update-result-accuracy"

        /**
         * Fetches location results from [android.content.SharedPreferences].
         */
        fun getSavedLocationResult(context: Context): List<Float> {
            return arrayListOf(PreferenceManager.getDefaultSharedPreferences(context)
                .getFloat(KEY_LOCATION_UPDATES_RESULT_LAT, -1.0f),
                PreferenceManager.getDefaultSharedPreferences(context).getFloat(KEY_LOCATION_UPDATES_RESULT_LON, -1.0f),
                PreferenceManager.getDefaultSharedPreferences(context).getFloat(KEY_LOCATION_UPDATES_RESULT_ACC, -1.0f))
        }
    }
}
