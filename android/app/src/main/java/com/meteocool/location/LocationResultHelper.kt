package com.meteocool.location;


import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.location.Location
import android.preference.PreferenceManager
import android.support.v4.app.NotificationCompat
import android.support.v4.app.TaskStackBuilder
import android.widget.Toast


import java.text.DateFormat
import java.util.Date

/**
 * Class to process location results.
 */
internal class LocationResultHelper(private val mContext: Context, private val mLocations: Location) {
    private var mNotificationManager: NotificationManager? = null

//    private val locationResultText: String
//        get() {
//            if (mLocations.isEmpty()) {
//                return "Unknown"
//            }
//            val sb = StringBuilder()
//            for (location in mLocations) {
//                sb.append("(")
//                sb.append(location.latitude)
//                sb.append(", ")
//                sb.append(location.longitude)
//                sb.append(")")
//                sb.append("\n")
//            }
//            return sb.toString()
//        }

    fun showLocationViaToast(){
        Toast.makeText(mContext, "$mLocations", Toast.LENGTH_SHORT).show()
    }

    /**
     * Get the notification mNotificationManager.
     *
     *
     * Utility method as this helper works with it a lot.
     *
     * @return The system service NotificationManager
     */
    private val notificationManager: NotificationManager
        get() {
            if (mNotificationManager == null) {
                mNotificationManager = mContext.getSystemService(
                    Context.NOTIFICATION_SERVICE) as NotificationManager
            }
            return mNotificationManager!!
        }


    /**
     * Saves location result as a string to [android.content.SharedPreferences].
     */
//    fun saveResults() {
//        PreferenceManager.getDefaultSharedPreferences(mContext)
//            .edit()
//            .putString(KEY_LOCATION_UPDATES_RESULT, )
//            .apply()
//    }

    /**
     * Displays a notification with the location results.
     */
    fun showNotification() {
//        val notificationIntent = Intent(mContext, MainActivity::class.java)
//
//        // Construct a task stack.
//        val stackBuilder = TaskStackBuilder.create(mContext)
//
//        // Add the main Activity to the task stack as the parent.
//        stackBuilder.addParentStack(MainActivity::class.java)
//
//        // Push the content Intent onto the stack.
//        stackBuilder.addNextIntent(notificationIntent)
//
//        // Get a PendingIntent containing the entire back stack.
//        val notificationPendingIntent = stackBuilder.getPendingIntent(0, PendingIntent.FLAG_UPDATE_CURRENT)

        //        NotificationCompat.Builder notificationBuilder2 = new NotificationCompat.Builder(mContext, PRIMARY_CHANNEL)
        //                .setContentTitle(getLocationResultTitle())
        //                .setContentText(getLocationResultText())
        //                .setSmallIcon(R.mipmap.ic_launcher)
        //                .setAutoCancel(true)
        //                .setContentIntent(notificationPendingIntent);

//        val notificationBuilder = Notification.Builder(mContext, PRIMARY_CHANNEL)
//            .setContentTitle(locationResultTitle)
//            .setContentText(locationResultText)
//            .setSmallIcon(R.mipmap.ic_launcher)
//            .setAutoCancel(true)
//            .setContentIntent(notificationPendingIntent)


    }

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
}
