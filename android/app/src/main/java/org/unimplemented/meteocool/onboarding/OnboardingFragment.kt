package org.unimplemented.meteocool.onboarding

import android.preference.PreferenceManager
import android.support.v17.leanback.app.OnboardingSupportFragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import org.unimplemented.meteocool.R

class OnboardingFragment : OnboardingSupportFragment(){

    companion object{
        val IS_ONBOARD_COMPLETED = "isOnboardCompleted"
    }

    override fun getPageDescription(p0: Int): CharSequence {
        return IS_ONBOARD_COMPLETED
    }

    override fun onCreateForegroundView(p0: LayoutInflater?, p1: ViewGroup?): View? {
        return this.view
    }

    override fun onCreateBackgroundView(p0: LayoutInflater?, p1: ViewGroup?): View? {
        return this.view
    }

    override fun getPageCount(): Int {
        return 0;
    }

    override fun onCreateContentView(p0: LayoutInflater?, p1: ViewGroup?): View? {
        return ImageView(context).apply {
            scaleType = ImageView.ScaleType.CENTER_INSIDE
            setImageResource(R.drawable.onboarding_content_view)
            setPadding(0, 32, 0, 32)
            contentView = this
        }

    }

    override fun getPageTitle(p0: Int): CharSequence {
        return IS_ONBOARD_COMPLETED
    }

    override fun onFinishFragment() {
        super.onFinishFragment()
        PreferenceManager.getDefaultSharedPreferences(context).edit().apply {
            putBoolean(IS_ONBOARD_COMPLETED, true)
            apply()
        }
        activity!!.finish()
    }

    override fun onProvideTheme(): Int {
        return  R.style.Theme_Leanback_Onboarding

    }
}