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
class WebAppInterface(private val  activity: Activity) {

    companion object{
        private val TAG = "WebAppInterface"
    }

    private val webView = activity.findViewById<WebView>(R.id.webView)

    @JavascriptInterface
    fun injectLocation() {
        Log.d(TAG, "injectLocation")
        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(activity)
        if(Validator.isLocationPermissionGranted(activity)) {
            Log.d(TAG, "entered")
            val lastLocation = LocationResultHelper.getSavedLocationResult(activity)

            if(lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT) >= 0.0) {

                val lat = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LAT)
                val lon = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_LON)
                val acc = lastLocation.getValue(LocationResultHelper.KEY_LOCATION_UPDATES_RESULT_ACC)
                val string = "window.injectLocation($lat , $lon , $acc , true);"
                Log.d(TAG, string)
                webView.post({
                    run  {
                        webView.evaluateJavascript(string, { _ ->
                            Log.d(TAG, string)
                        })
                    }
                })
            }else{
                Toast.makeText(activity, R.string.gps_button_toast, Toast.LENGTH_SHORT).show()
            }
        }else{
            Log.d(TAG, "Permission not granted")
        }
    }

    @JavascriptInterface
    fun showSettings(){
        val drawerLayout: DrawerLayout = activity.findViewById(R.id.drawer_layout)
        drawerLayout.openDrawer(GravityCompat.START)
    }

    @JavascriptInterface
    fun requestSettings(){
        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(activity)
        val settings : Gson = Gson().newBuilder().create()
        val myMap = mapOf<String, Boolean>(
                Pair("darkMode",preferenceManager.getBoolean("map_mode", false)),
                Pair("zoomOnForeground",preferenceManager.getBoolean("map_zoom", false)),
                Pair("mapRotation",preferenceManager.getBoolean("map_rotate", false)))

        val string = "window.injectSettings(${settings.toJson(myMap)});"
        webView.post({
            run  {
                webView.evaluateJavascript(string, { foo ->
                    Log.d(TAG, string)
                    Log.d(TAG, foo)
                })
            }
        })
    }


}
