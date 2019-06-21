package com.meteocool

import android.os.Bundle
import androidx.fragment.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import java.util.*


class MapFragment : Fragment(){

    companion object {
        private const val WEB_URL = "https://meteocool.com/?mobile=android2"
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


        val locale = when(Locale.getDefault().displayLanguage.compareTo(Locale.GERMAN.displayLanguage)){
            0 -> "&lang=de"
            else -> "&lang=en"
        }
        mWebView?.loadUrl(WEB_URL +locale)
        // Force links and redirects to open in the WebView instead of in a browser
        mWebView?.webViewClient = WebViewClient()
        return view
    }
}
