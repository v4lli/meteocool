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
        val sliderPage1 = SliderPage()
        sliderPage1.title = getString(R.string.onboarding_title1)
        sliderPage1.description = getString(R.string.onboarding_description1)
        sliderPage1.imageDrawable = R.drawable.volunteers
        sliderPage1.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage1.titleColor = resources.getColor(R.color.textColor)
        sliderPage1.descColor = resources.getColor(R.color.textColor)

        val sliderPage2 = SliderPage()
        sliderPage2.title = getString(R.string.onboarding_title2)
        sliderPage2.description = getString(R.string.onboarding_description2)
        sliderPage2.imageDrawable = R.drawable.jacket
        sliderPage2.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage2.titleColor = resources.getColor(R.color.textColor)
        sliderPage2.descColor = resources.getColor(R.color.textColor)

        val sliderPage3 = SliderPage()
        sliderPage3.title = getString(R.string.onboarding_title3)
        sliderPage3.description = getString(R.string.onboarding_description3)
        sliderPage3.imageDrawable = R.drawable.bell
        sliderPage3.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage3.titleColor = resources.getColor(R.color.textColor)
        sliderPage3.descColor = resources.getColor(R.color.textColor)

        val sliderPage4 = SliderPage()
        sliderPage4.title = getString(R.string.onboarding_title4)
        sliderPage4.description = getString(R.string.onboarding_description4)
        sliderPage4.imageDrawable = R.drawable.maps_and_location
        sliderPage4.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage4.titleColor = resources.getColor(R.color.textColor)
        sliderPage4.descColor = resources.getColor(R.color.textColor)

        val sliderPage5 = SliderPage()
        sliderPage5.title = getString(R.string.onboarding_title5)
        sliderPage5.description = getString(R.string.onboarding_description5)
        sliderPage5.imageDrawable = R.drawable.sun_rain_composit_3x2
        sliderPage5.bgColor = resources.getColor(R.color.colorPrimary)
        sliderPage5.titleColor = resources.getColor(R.color.textColor)
        sliderPage5.descColor = resources.getColor(R.color.textColor)

        setBarColor(resources.getColor(R.color.cloudAccent));
        setSeparatorColor(resources.getColor(R.color.textColor));

        addSlide(AppIntroFragment.newInstance(sliderPage1))
        addSlide(AppIntroFragment.newInstance(sliderPage2))
        addSlide(AppIntroFragment.newInstance(sliderPage3))
        addSlide(AppIntroFragment.newInstance(sliderPage4))
        addSlide(AppIntroFragment.newInstance(sliderPage5))
        Log.d("LANGUAGE", Locale.getDefault().displayLanguage)
    }


}
