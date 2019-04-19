package org.unimplemented.meteocool

import android.Manifest
import android.app.Service
import android.content.pm.PackageManager
import android.location.LocationManager
import android.os.Bundle
import android.support.v4.app.Fragment
import android.support.v4.content.ContextCompat
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient


class MapFragment : Fragment(){

    companion object {
        private const val WEB_URL = "https://meteocool.com/?mobile=android"
    }

    private var mWebView : WebView? = null

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_map, container, false)
        mWebView = view.findViewById(R.id.webView) as WebView
        val webSettings = mWebView?.settings
        webSettings?.javaScriptEnabled = true
        webSettings?.domStorageEnabled = true
        webSettings?.databaseEnabled = true
        webSettings?.setGeolocationEnabled(true)



        mWebView?.loadUrl(WEB_URL)



        // Force links and redirects to open in the WebView instead of in a browser
        mWebView?.webViewClient = WebViewClient()

        return view
    }

    override fun onActivityCreated(savedInstanceState: Bundle?) {
        super.onActivityCreated(savedInstanceState)
        val locationManager = activity!!.getSystemService(Service.LOCATION_SERVICE) as (LocationManager)

        Thread.sleep(2000)
        if (ContextCompat.checkSelfPermission(activity!!.applicationContext, Manifest.permission.ACCESS_FINE_LOCATION)
            == PackageManager.PERMISSION_GRANTED) {
            val lastKnownLocation = locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
            Log.d("JSINJECT", "entered")
            val string = "window.injectLocation(${lastKnownLocation.latitude}, ${lastKnownLocation.longitude}, ${lastKnownLocation.accuracy});"
            Log.d("JSINJECT", "$string")
            mWebView?.evaluateJavascript(string, { value ->
                Log.d("JSINJECT","$value")
            } )
        }
    }
}
