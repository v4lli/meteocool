package org.unimplemented.meteocool

import android.app.NotificationManager
import android.content.Context
import android.os.Bundle
import android.support.v4.app.Fragment
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient


class MapFragment : Fragment(){

    companion object {
        private const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
    }

    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View? {
        val view = inflater.inflate(R.layout.fragment_map, container, false)
        val mWebView = view.findViewById(R.id.webView) as WebView
        val webSettings = mWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        mWebView.loadUrl(WEB_URL)

        // Force links and redirects to open in the WebView instead of in a browser
        mWebView.webViewClient = WebViewClient()

        return view
    }

}
