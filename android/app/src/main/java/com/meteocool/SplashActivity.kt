package com.meteocool

import android.content.Intent
import android.os.Bundle
import android.preference.PreferenceManager
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import com.meteocool.security.Validator
import org.jetbrains.anko.defaultSharedPreferences

class SplashActivity : AppCompatActivity(){
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("Splash", isOnboardingCompleted().toString())
        if(Validator.isLocationPermissionGranted(this)) {
            defaultSharedPreferences.edit().putBoolean("notification", true).apply()
        }else{
            defaultSharedPreferences.edit().putBoolean("notification", false).apply()
            defaultSharedPreferences.edit().putBoolean("map_zoom", false).apply()
        }
        if(!isOnboardingCompleted()) {
            startActivity(Intent(this.applicationContext, OnboardingActivity::class.java))
        }else {
            startActivity(Intent(this.applicationContext, MeteocoolActivity::class.java))
        }
        finish()
    }

    private fun isOnboardingCompleted() : Boolean {
        return defaultSharedPreferences.getBoolean(OnboardingActivity.IS_ONBOARD_COMPLETED, false)
    }
}
