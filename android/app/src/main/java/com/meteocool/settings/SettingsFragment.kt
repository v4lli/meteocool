package com.meteocool.settings

import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import androidx.preference.PreferenceFragmentCompat
import com.meteocool.R
import com.meteocool.location.LocationResultHelper
import com.meteocool.location.WebAppInterface

class SettingsFragment() : PreferenceFragmentCompat(), SharedPreferences.OnSharedPreferenceChangeListener  {


    companion object {
        private const val TAG = "Settings"
    }

    override fun onResume() {
        super.onResume()
        preferenceManager.sharedPreferences.registerOnSharedPreferenceChangeListener(this)
    }

    override fun onPause() {
        super.onPause()
        preferenceManager.sharedPreferences.unregisterOnSharedPreferenceChangeListener(this)
    }


    override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) {

        when(key){
            "map_mode", "map_zoom", "map_rotate" -> {
                Log.i(TAG, "Preference value $key was updated to ${sharedPreferences!!.getBoolean(key, false)} ")
                val webAppInterface = WebAppInterface(activity!!)
                webAppInterface.requestSettings()
            }
            "notification" -> {
                //TODO stop and enable location sending in background
            }
            "notification_intensity" ->{
                val intensity = sharedPreferences!!.getString(key, "-1")!!.toInt()
                Log.i(TAG, "Preference value $key was updated to $intensity")
                LocationResultHelper.NOTIFICATION_INTENSITY = intensity
            }
            "notification_time" ->{
                val timeAhead = sharedPreferences!!.getString(key, "-1")!!.toInt()
                Log.i(TAG, "Preference value $key was updated to $timeAhead ")
                LocationResultHelper.NOTIFICATION_TIME = timeAhead
            }
        }
    }

    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.root_preferences, rootKey)
    }
}
