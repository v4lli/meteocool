package com.meteocool.location

import android.content.Context
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import com.meteocool.R
import com.meteocool.security.Validator

/** Instantiate the interface and set the comntext */
class WebAppInterface(private val mContext: Context, private val mWebView: WebView) {

    @JavascriptInterface
    fun injectLocation() {

        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(mContext)

        if(Validator.isLocationPermissionGranted(mContext)) {

            val lastLocation = LocationResultHelper.getSavedLocationResult(mContext)

            if(lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT) >= 0.0) {
                Log.d("JSINJECT", "entered")
                val lat = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT)
                val lon = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LON)
                val acc = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_ACC)
                val string = "window.injectLocation($lat , $lon , $acc , true);"
                mWebView.post({
                    run  {
                        mWebView.evaluateJavascript(string, { _ ->
                            Log.d("JSINJECT", string)
                        })
                    }
                })
            }else{
                Toast.makeText(mContext, R.string.gps_button_toast, Toast.LENGTH_SHORT).show()
            }
        }
    }
}
