package org.unimplemented.meteocool.location

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.preference.PreferenceManager
import android.support.v4.content.ContextCompat
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import org.unimplemented.meteocool.R

/** Instantiate the interface and set the comntext */
class WebAppInterface(private val mContext: Context, private val mWebView: WebView) {

    @JavascriptInterface
    fun injectLocation() {

        val preferenceManager = PreferenceManager.getDefaultSharedPreferences(mContext)

        if (ContextCompat.checkSelfPermission(mContext, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            val lat = preferenceManager.getFloat("latitude", -1f)
            val lon = preferenceManager.getFloat("longitude", -1f)
            val acc = preferenceManager.getFloat("accuracy", -1f)

            if(lat >= 0.0) {
                Log.d("JSINJECT", "entered")
                val string = "window.injectLocation($lat, $lon, $acc, true);"
                //val mWebView : WebView = View(mContext).findViewById(R.id.webView)
                Log.d("JSINJECT", string)
                mWebView.post({
                    run  {
                        mWebView.evaluateJavascript(string, { value ->
                            Log.d("JSINJECT", string)
                        })
                    }
                })
            }else{
                Toast.makeText(mContext, "Location null", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
