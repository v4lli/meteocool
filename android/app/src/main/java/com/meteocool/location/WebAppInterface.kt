package com.meteocool.location

import android.app.Activity
import android.content.Context
import android.preference.PreferenceManager
import android.util.Log
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import androidx.core.view.GravityCompat
import androidx.drawerlayout.widget.DrawerLayout
import com.google.gson.Gson
import com.meteocool.R
import com.meteocool.security.Validator



/** Instantiate the interface and set the comntext */
class WebAppInterface(private val  activity: Activity, private val mContext: Context, private val mWebView: WebView) {

    companion object{
        private val TAG = "WebAppInterface"
    }

    @JavascriptInterface
    fun injectLocation() {
        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(mContext)
        if(Validator.isLocationPermissionGranted(mContext)) {

            val lastLocation = LocationResultHelper.getSavedLocationResult(mContext)

            if(lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT) >= 0.0) {
                Log.d(TAG, "entered")
                val lat = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT)
                val lon = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LON)
                val acc = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_ACC)
                val string = "window.injectLocation($lat , $lon , $acc , true);"
                mWebView.post({
                    run  {
                        mWebView.evaluateJavascript(string, { _ ->
                            Log.d(TAG, string)
                        })
                    }
                })
            }else{
                Toast.makeText(mContext, R.string.gps_button_toast, Toast.LENGTH_SHORT).show()
            }
        }
    }

    @JavascriptInterface
    fun showSettings(){
        val drawerLayout: DrawerLayout = activity.findViewById(R.id.drawer_layout)
        drawerLayout.openDrawer(GravityCompat.START)
    }

    fun injectSettings(){
        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(mContext)
        val settings : Gson = Gson().newBuilder().create()
        val myMap = mapOf<String, Boolean>(
                Pair("darkMode",preferenceManager.getBoolean("map_mode", false)),
                Pair("zoomOnForeGround",preferenceManager.getBoolean("map_zoom", false)),
                Pair("mapRotation",preferenceManager.getBoolean("map_rotate", false)))

        val string = "window.injectSettings(${settings.toJson(myMap)});"
        Log.d(TAG, string)
        mWebView.post({
            run  {
                mWebView.evaluateJavascript(string, { _ ->
                    Log.d(TAG, string)
                })
            }
        })
    }


}
