package com.meteocool.location

import android.location.Location
import android.os.AsyncTask
import android.util.Log
import com.google.firebase.iid.FirebaseInstanceId
import com.meteocool.utility.JSONPost
import com.meteocool.utility.NetworkUtility
import java.util.*

class UploadLocation: AsyncTask<Any, Unit, Unit>(){
    override fun doInBackground(vararg params: Any?) {
        Log.d("Async", "location: $params[0].toString(), token: $params[1]")
        val location = params[0] as Location
        val verticalAccuracy = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            location.verticalAccuracyMeters
        } else {
            -1.0f
        }

        val token =  params[1].toString()

        NetworkUtility.sendPostRequest(
            JSONPost(
                location.latitude,
                location.longitude,
                location.altitude,
                location.accuracy,
                verticalAccuracy,
                123.0,
                System.currentTimeMillis().toDouble(),
                token,
                "android",
                LocationResultHelper.NOTIFICATION_TIME,
                LocationResultHelper.NOTIFICATION_INTENSITY,
                Locale.getDefault().language
            ), NetworkUtility.POST_CLIENT_DATA
        )
    }
}
