package org.unimplemented.meteocool.utility

import android.util.Log
import com.google.gson.Gson
import java.io.*
import java.net.HttpURLConnection
import java.net.URL

class NetworkUtility{
companion object {

    private const val REST_URL = "https://meteocool.com/post_location"
    private const val CLEAR_URL = "https://meteocool.com/clear_notification"

    private fun buildJSONString(json : JSONPost) : String{
        val gsonBuilder = Gson().newBuilder().create()
        val jsonAsString = gsonBuilder.toJson(json)
        Log.d("NetworkUtility", "JSON $jsonAsString")
        return jsonAsString
    }

    private fun buildJSONClear(json : JSONClearPost) : String{
        val gsonBuilder = Gson().newBuilder().create()
        val jsonAsString = gsonBuilder.toJson(json)
        Log.d("Clear", "JSON $jsonAsString")
        return jsonAsString
    }

    fun sendPostRequest(json : JSONPost) {

        val jsonAsString = buildJSONString(json)

        val mURL = URL(REST_URL)

        with(mURL.openConnection() as HttpURLConnection) {
            // optional default is GET
            requestMethod = "POST"
            setRequestProperty("charset", "utf-8")
            setRequestProperty("Content-lenght", jsonAsString.length.toString())
            setRequestProperty("Content-Type", "application/json")

            val wr = OutputStreamWriter(outputStream)

            wr.write(jsonAsString)
            wr.flush()

            Log.d("NetworkUtility", "URL $url")
            Log.d("NetworkUtility", "HTTP-Response $responseCode")


            BufferedReader(InputStreamReader(inputStream)).use {
                val response = StringBuffer()

                var inputLine = it.readLine()
                while (inputLine != null) {
                    response.append(inputLine)
                    inputLine = it.readLine()
                }
                it.close()
                Log.d("NetworkUtility", "$response")
            }
        }
    }

    fun sendClearPostRequest(json : JSONClearPost) {

        val mURL = URL(CLEAR_URL)

        with(mURL.openConnection() as HttpURLConnection) {
            // optional default is GET
            requestMethod = "POST"
            setRequestProperty("charset", "utf-8")
            setRequestProperty("Content-lenght", buildJSONClear(json).length.toString())
            setRequestProperty("Content-Type", "application/json")

            val wr = OutputStreamWriter(outputStream)

            wr.write(buildJSONClear(json))
            wr.flush()

            Log.d("Location", "URL $url")
            Log.d("Location", "HTTP-Response $responseCode")


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


}


