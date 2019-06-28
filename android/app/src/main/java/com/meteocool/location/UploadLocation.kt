package com.meteocool.location

import android.os.AsyncTask
import android.util.Log
import com.google.firebase.iid.FirebaseInstanceId
import com.meteocool.utility.JSONPost
import com.meteocool.utility.NetworkUtility

class UploadLocation: AsyncTask<android.location.Location, Unit, Unit>(){
    override fun doInBackground(vararg params: android.location.Location?) {
        Log.d("Async", "$params[0].toString()")
        val verticalAccuracy = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            params[0]!!.verticalAccuracyMeters
        } else {
            -1.0f
        }

        var token =  FirebaseInstanceId.getInstance().token
        if(token==null) {token = "no token"}
        NetworkUtility.sendPostRequest(
            JSONPost(
                params[0]!!.latitude,
                params[0]!!.longitude,
                params[0]!!.altitude,
                params[0]!!.accuracy,
                verticalAccuracy,
                123.0,
                System.currentTimeMillis().toDouble(),
                token,
                "android",
                LocationResultHelper.NOTIFICATION_TIME,
                LocationResultHelper.NOTIFICATION_INTENSITY
            ), NetworkUtility.POST_CLIENT_DATA_URL
        )
    }
}
