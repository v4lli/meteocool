package org.unimplemented.meteocool.location

import android.os.AsyncTask
import android.util.Log
import org.unimplemented.meteocool.utility.JSONPost
import org.unimplemented.meteocool.utility.NetworkUtility

class UploadLocation: AsyncTask<android.location.Location, Unit, Unit>(){
    override fun doInBackground(vararg params: android.location.Location?) {
        Log.d("Async", "$params[0].toString()")
        val verticalAccuracy = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            params[0]!!.verticalAccuracyMeters
        } else {
            -1.0f
        }
        NetworkUtility.sendPostRequest(
            JSONPost(
                params[0]!!.latitude,
                params[0]!!.longitude,
                params[0]!!.altitude,
                params[0]!!.accuracy,
                verticalAccuracy,
                123.0,
                System.currentTimeMillis().toDouble(),
                "anon",
                "android",
                15,
                10
            )
        )
    }
}
