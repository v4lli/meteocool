package org.unimplemented.meteocool.onboarding

import android.os.Bundle
import android.support.v7.app.AppCompatActivity
import org.unimplemented.meteocool.R

class Startup : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        supportFragmentManager.beginTransaction().add(R.id.fragmentContainer, OnboardingFragment()).commit()
        setContentView(R.layout.activity_startup)
    }


}