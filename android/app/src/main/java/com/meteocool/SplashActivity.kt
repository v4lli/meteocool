package com.meteocool

import android.content.Intent
import android.os.Bundle
import android.preference.PreferenceManager
import android.util.Log
import androidx.appcompat.app.AppCompatActivity

class SplashActivity : AppCompatActivity(){
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("Splash", isOnboardingCompleted().toString())
        if(!isOnboardingCompleted()) {
            startActivity(Intent(this.applicationContext, OnboardingActivity::class.java))
        }else {
            startActivity(Intent(this.applicationContext, MeteocoolActivity::class.java))
        }
        finish()
    }

    private fun isOnboardingCompleted() : Boolean {
        return PreferenceManager.getDefaultSharedPreferences(this).getBoolean(OnboardingActivity.IS_ONBOARD_COMPLETED, false)
    }
}
