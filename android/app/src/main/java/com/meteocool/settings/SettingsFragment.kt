package com.meteocool.settings

import android.os.Bundle
import androidx.preference.PreferenceFragmentCompat
import com.meteocool.R

class SettingsFragment() : PreferenceFragmentCompat() {
    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.root_preferences, rootKey)
    }
}
