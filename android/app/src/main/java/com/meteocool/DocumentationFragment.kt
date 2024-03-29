package com.meteocool

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.fragment.app.Fragment

class DocumentationFragment : Fragment() {

    companion object {
        private const val WEB_URL = "https://meteocool.com/documentation.html"
    }

    private var mWebView: WebView? = null

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
}