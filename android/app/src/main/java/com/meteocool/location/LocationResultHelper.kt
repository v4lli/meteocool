package com.meteocool.location;


import android.content.Context
import android.location.Location
import android.preference.PreferenceManager
import android.widget.Toast

/**
 * Class to process location results.
 */
internal class LocationResultHelper(private val mContext: Context, private val mLocation: Location) {

    private val FIVE_MINUTES: Long = 1000 * 60 * 5

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

    /** Determines whether one Location reading is better than the current Location fix
     * @param location The new Location that you want to evaluate
     * @param currentBestLocation The current Location fix, to which you want to compare the new one
     */
    fun isBetterLocation(location: Location, currentBestLocation: Location?): Boolean {
        if (currentBestLocation == null) {
            // A new location is always better than no location
            return true
        }

        // Check whether the new location fix is newer or older
        val timeDelta: Long = location.time - currentBestLocation.time
        val isSignificantlyNewer: Boolean = timeDelta > FIVE_MINUTES
        val isSignificantlyOlder:Boolean = timeDelta < -FIVE_MINUTES

        when {
            // If it's been more than two minutes since the current location, use the new location
            // because the user has likely moved
            isSignificantlyNewer -> return true
            // If the new location is more than two minutes older, it must be worse
            isSignificantlyOlder -> return false
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
