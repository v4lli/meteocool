package org.unimplemented.meteocool.location

import android.Manifest
import android.app.Service
import android.content.Context
import android.content.pm.PackageManager
import android.location.LocationManager
import android.support.v4.content.ContextCompat
import android.support.v4.content.ContextCompat.getSystemService
import android.util.Log
import android.view.View
import android.webkit.JavascriptInterface
import android.webkit.WebView
import android.widget.Toast
import org.unimplemented.meteocool.R

/** Instantiate the interface and set the context  */
class WebAppInterface(private val mContext: Context, private val mWebView : WebView) {

    /** Show a toast from the web page  */
    @JavascriptInterface
    fun injectLocation() {
       // Toast.makeText(mContext, "From Server", Toast.LENGTH_SHORT).show()

        val locationManager = mContext.getSystemService(Service.LOCATION_SERVICE) as (LocationManager)

        if (ContextCompat.checkSelfPermission(mContext, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            val lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            //if(lastKnownLocation != null) {
            Log.d("JSINJECT", "entered")
            //val mWebView  : WebView = View(mContext).findViewById(R.id.webView)


            val string = "window.injectLocation(49.0, 11.0, 100);"
            Log.d("JSINJECT", "$string")
            mWebView.post({
                run() {
                    mWebView.evaluateJavascript(string, { value ->
                        Log.d("JSINJECT", "$value")
                    })
                }
            });

            //}
        }


    }
}
