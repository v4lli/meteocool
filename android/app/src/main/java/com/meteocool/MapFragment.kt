package com.meteocool

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import com.meteocool.location.WebAppInterface
import java.util.*


class MapFragment() : Fragment(){

    companion object {
        const val MAP_URL = "https://meteocool.com/?mobile=android2"
        const val DOC_URL = "https://meteocool.com/documentation.html"
    }

    var mWebView : WebView? = null

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_map, container, false)
        mWebView = view.findViewById(R.id.webView) as WebView
        val webSettings = mWebView?.settings
        webSettings?.javaScriptEnabled = true
        webSettings?.domStorageEnabled = true
        webSettings?.databaseEnabled = true
        webSettings?.setGeolocationEnabled(true)

        val locale = when(Locale.getDefault().displayLanguage.compareTo(Locale.GERMAN.displayLanguage)){
            0 -> "&lang=de"
            else -> "&lang=en"
        }
        mWebView?.loadUrl(MAP_URL +locale)
        // Force links and redirects to open in the WebView instead of in a browser
        mWebView?.webViewClient = WebViewClient()
        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        val webAppInterface = WebAppInterface(activity!!)
        mWebView!!.addJavascriptInterface(webAppInterface, "Android")
    }
}
