package org.unimplemented.meteocool.onboarding

import android.os.Bundle
import com.github.paolorotolo.appintro.AppIntro
import com.github.paolorotolo.appintro.AppIntro2
import com.github.paolorotolo.appintro.AppIntroFragment
import com.github.paolorotolo.appintro.model.SliderPage
import org.unimplemented.meteocool.R


class Onboarding : AppIntro2(){

    companion object{
        val IS_ONBOARD_COMPLETED = "onboard_completed"
    }
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val sliderPage = SliderPage()
        sliderPage.title = getString(R.string.title_slide1)
        sliderPage.description = getString(R.string.description_slide1)
        sliderPage.imageDrawable = R.drawable.icon_83
        sliderPage.bgColor = getColor(R.color.colorPrimary)
        sliderPage.descColor = getColor(R.color.textColor)
        sliderPage.titleColor = getColor(R.color.textColor)

        val sliderPage2 = SliderPage()
        sliderPage2.title = getString(R.string.title_slide2)
        sliderPage2.description = getString(R.string.description_slide2)
        sliderPage2.imageDrawable = R.drawable.jacket
        sliderPage2.bgColor = getColor(R.color.colorPrimary)

        val sliderPage3 = SliderPage()
        sliderPage3.title = getString(R.string.title_slide3)
        sliderPage3.description = getString(R.string.description_slide3)
        sliderPage3.imageDrawable = R.drawable.rain
        sliderPage3.bgColor = getColor(R.color.colorPrimary)

        val sliderPage4 = SliderPage()
        sliderPage4.title = getString(R.string.title_slide4)
        sliderPage4.description = getString(R.string.description_slide4)
        sliderPage4.imageDrawable = R.drawable.rain
        sliderPage4.bgColor = getColor(R.color.colorPrimary)

        val sliderPage5 = SliderPage()
        sliderPage5.title = getString(R.string.title_slide5)
        sliderPage5.description = getString(R.string.description_slide5)
        sliderPage5.imageDrawable = R.drawable.rain
        sliderPage5.bgColor = getColor(R.color.colorPrimary)

        //setBarColor(getColor(R.color.buttonColor));
        //setSeparatorColor(getColor(R.color.colorPrimary));

        addSlide(AppIntroFragment.newInstance(sliderPage))
        addSlide(AppIntroFragment.newInstance(sliderPage2))
        addSlide(AppIntroFragment.newInstance(sliderPage3))
        addSlide(AppIntroFragment.newInstance(sliderPage4))
        addSlide(AppIntroFragment.newInstance(sliderPage5))
    }
}