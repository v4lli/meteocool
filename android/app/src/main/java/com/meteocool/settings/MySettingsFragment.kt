package com.meteocool.settings

import android.os.Bundle
import androidx.preference.PreferenceFragmentCompat
import com.meteocool.R

class MySettingsFragment : PreferenceFragmentCompat()  {
    override fun onCreatePreferences(savedInstanceState: Bundle?, rootKey: String?) {
        setPreferencesFromResource(R.xml.preferences, rootKey)
    }
}
