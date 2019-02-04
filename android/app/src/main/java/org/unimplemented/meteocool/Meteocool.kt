package org.unimplemented.meteocool

import android.support.v7.app.AppCompatActivity
import android.os.Bundle
import android.webkit.WebView

import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

import com.google.gson.Gson
import org.jetbrains.anko.doAsync
import java.io.*
import java.net.HttpURLConnection
import java.net.URL


class Meteocool : AppCompatActivity() {

    companion object {
       const val WEB_URL = "https://meteocool.unimplemented.org/?mobile=android"
       const val REST_URL = "https://meteocool.unimplemented.org/post_location"
       const val PERMISSION_REQUEST_LOCATION = 0
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        checkPermission()
        val myWebView = WebView(this)
        val webSettings = myWebView.settings
        webSettings.javaScriptEnabled = true
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        setContentView(myWebView)
        myWebView.loadUrl("https://meteocool.unimplemented.org/?mobile=android")

        var preference = PreferenceManager.getDefaultSharedPreferences(applicationContext)
        Log.d("Preferences", preference.getString("FIREBASE_TOKEN", "error"))


        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Create channel to show notifications.
            val channelId = getString(R.string.notifications_admin_channel_id)
            val channelName = getString(R.string.notifications_admin_channel_name)
            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(NotificationChannel(channelId,
                channelName, NotificationManager.IMPORTANCE_LOW))
        }
        myWebView.loadUrl(WEB_URL)
    }

    override fun onResume() {
        super.onResume()
        doAsync {sendPostRequest()}
    }

    private fun checkPermission() {
        // Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION),
                PERMISSION_REQUEST_LOCATION
            )
/*
            // Permission is not granted
            // Should we show an explanation?
            if (ActivityCompat.shouldShowRequestPermissionRationale(
                    this,
                    Manifest.permission.ACCESS_FINE_LOCATION
                )
            ) {
                //TODO Show permission information
                // Show an explanation to the user *asynchronously* -- don't block
                // this thread waiting for the user's response! After the user
                // sees the explanation, try again to request the permission.
            } else {
                // No explanation needed, we can request the permission.
                ActivityCompat.requestPermissions(
                    this,
                    arrayOf(Manifest.permission.READ_CONTACTS),
                    PERMISSION_REQUEST_LOCATION
                )

                // PERMISSION_REQUEST_LOCATION is an
                // app-defined int constant. The callback method gets the
                // result of the request.
            }*/
        } else {
            // Permission has already been granted
        }
    }

    private fun makeJSON() : String{
        val gsonBuilder = Gson().newBuilder().create()
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
        val test = gsonBuilder.toJson(post)
        Log.d("JSON", test)
        return test
    }

    private fun sendPostRequest() {

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
