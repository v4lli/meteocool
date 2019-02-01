package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.webkit.WebView
import com.google.gson.Gson
import org.jetbrains.anko.doAsync
import java.io.*
import java.net.HttpURLConnection
import java.net.URL


class Meteocool : AppCompatActivity() {

    companion object {
       const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
       const val REST_URL = "https://meteocool.unimplemented.org/post_location"
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val myWebView = WebView(this)
        val webSettings = myWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        setContentView(myWebView)
        myWebView.loadUrl(WEB_URL)
    }

    override fun onResume() {
        super.onResume()
        doAsync {sendPostRequest()}
    }

    private fun makeJSON() : String{
        val gson = Gson().newBuilder().create()
        val post = ServerPost(
            1.0,
            1.0,
            1.1,
            1.1,
            1.0,
            123.0,
            1234.0,
            "anon",
            "ios",
            15,
            10)
        val test = gson.toJson(post)
        Log.d("JSON", test)
        return test
    }

    private fun sendPostRequest() {

        //var reqParam = URLEncoder.encode("username", "UTF-8") + "=" + URLEncoder.encode(userName, "UTF-8")
        //reqParam += "&" + URLEncoder.encode("password", "UTF-8") + "=" + URLEncoder.encode(password, "UTF-8")
        val mURL = URL(REST_URL)

        with(mURL.openConnection() as HttpURLConnection) {
            // optional default is GET
            requestMethod = "POST"
            setRequestProperty("charset", "utf-8")
            setRequestProperty("Content-lenght", makeJSON().toString().length.toString())
            setRequestProperty("Content-Type", "application/json")

            val wr = OutputStreamWriter(outputStream)

            val buffer = ByteArrayOutputStream()
            val oos = ObjectOutputStream(buffer)

            wr.write(makeJSON())
            wr.flush()

            Log.d("URL", "$url")
            Log.d("Response Code", "$responseCode")


            BufferedReader(InputStreamReader(inputStream)).use {
                val response = StringBuffer()

                var inputLine = it.readLine()
                while (inputLine != null) {
                    response.append(inputLine)
                    inputLine = it.readLine()
                }
                it.close()
                Log.d("Response", "$response")
            }
        }

    }
}
