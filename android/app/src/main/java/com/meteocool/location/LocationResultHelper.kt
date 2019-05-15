package com.meteocool.location

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.graphics.Color
import android.location.Location
import android.preference.PreferenceManager
import com.meteocool.R
import java.text.DateFormat
import java.util.*

class LocationResultHelper {

    companion object {
        val KEY_LOCATION_UPDATES_RESULT = "location-update-result"
        private val PRIMARY_CHANNEL = "default"

        /**
         * Fetches location results from [android.content.SharedPreferences].
         */
        fun getSavedLocationResult(context: Context): String? {
            return PreferenceManager.getDefaultSharedPreferences(context)
                .getString(KEY_LOCATION_UPDATES_RESULT, "")
        }
    }

    private val mContext: Context
    private val mLocations: List<Location>
    private var mNotificationManager: NotificationManager? = null

    constructor(context: Context, locations : List<Location>){
        mContext = context
        mLocations = locations

    }

    private fun findBestLocationReported(){
        if (mLocations.isEmpty()) {
            // Do nothing
        }

        (mLocations).forEach {location ->
            location.time
            // Check which reported location is the best
        }

    }

    /**
     * Returns the title for reporting about a list of [Location] objects.
     */
    private fun getLocationResultTitle(): String {
        val numLocationsReported = mLocations.size.toString()

        return numLocationsReported + ": " + DateFormat.getDateTimeInstance().format(Date())
    }

    private fun getLocationResultText(): String {
        if (mLocations.isEmpty()) {
            return "Unknown location"
        }
        val sb = StringBuilder()
        for (location in mLocations) {
            sb.append("(")
            sb.append(location.latitude)
            sb.append(", ")
            sb.append(location.longitude)
            sb.append(")")
            sb.append("\n")
        }
        return sb.toString()
    }

    /**
     * Saves location result as a string to [android.content.SharedPreferences].
     */
    fun saveResults() {
        PreferenceManager.getDefaultSharedPreferences(mContext)
            .edit()
            .putString(
                KEY_LOCATION_UPDATES_RESULT, getLocationResultTitle() + "\n" +
                    getLocationResultText()
            )
            .apply()
    }

    //
    fun uploadBestLocation(){
        //TODO similar to show notification
    }





}
