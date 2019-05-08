package org.unimplemented.meteocool.onboarding

import android.os.Bundle
import android.util.Log
import com.github.paolorotolo.appintro.AppIntro
import com.github.paolorotolo.appintro.AppIntroFragment
import com.github.paolorotolo.appintro.model.SliderPage
import org.unimplemented.meteocool.R
import java.util.*


class OnboardingActivity : AppIntro() {

    companion object{
        val IS_ONBOARD_COMPLETED = "is_onboard_completed"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val sliderPage = SliderPage()
        sliderPage.title = getString(R.string.onboarding_title1)
        sliderPage.description = getString(R.string.onboarding_description1)
        sliderPage.imageDrawable = R.drawable.sun_rain_composit_3x
        sliderPage.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage.titleColor = resources.getColor(R.color.textColor)
        sliderPage.descColor = resources.getColor(R.color.textColor)
        resources.getColor(R.color.textColor)
        setBarColor(resources.getColor(R.color.cloudAccent));
        setSeparatorColor(resources.getColor(R.color.textColor));

        addSlide(AppIntroFragment.newInstance(sliderPage))
        Log.d("LANGUAGE", Locale.getDefault().displayLanguage)
    }


}
