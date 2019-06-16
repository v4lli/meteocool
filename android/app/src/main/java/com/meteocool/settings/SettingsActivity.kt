package com.meteocool.settings

import android.content.SharedPreferences
import android.os.Bundle
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.preference.*
import com.meteocool.R

class SettingsActivity : AppCompatActivity(), SharedPreferences.OnSharedPreferenceChangeListener  {

    companion object {
        private const val TAG = "Settings"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.settings_activity)

        //val mySettingsFragment =
        //PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(mySettingsFragment)

        PreferenceManager.getDefaultSharedPreferences(this).registerOnSharedPreferenceChangeListener(this)



        supportFragmentManager
            .beginTransaction()
            .replace(R.id.settings, SettingsFragment())
            .commit()
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    override fun onSharedPreferenceChanged(sharedPreferences: SharedPreferences?, key: String?) {
        if (key == "notification") {
            Log.i(TAG, "Preference value $key was updated to: " + sharedPreferences!!.getBoolean(key, false))
        }
        if(key == "notification_time"){

        }
    }

    class SettingsFragment : PreferenceFragmentCompat(){

        override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
            setPreferencesFromResource(R.xml.root_preferences, rootKey)
        }
    }
}
