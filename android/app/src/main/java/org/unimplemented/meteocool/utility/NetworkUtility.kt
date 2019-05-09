package org.unimplemented.meteocool.utility

import android.util.Log
import com.google.gson.Gson
import java.io.*
import java.lang.Exception
import java.net.HttpURLConnection
import java.net.URL

class NetworkUtility{
companion object {

    val POST_CLIENT_DATA_URL = URL("https://meteocool.com/post_location")
    val CLEAR_URL  = URL("https://meteocool.com/clear_notification")

    private fun buildJSONString(json : JSON) : String{
        val gsonBuilder = Gson().newBuilder().create()
        val jsonAsString = gsonBuilder.toJson(json)
        Log.d("NetworkUtility", "JSON $jsonAsString")
        return jsonAsString
    }

    fun sendPostRequest(json : JSON, url: URL) {

        val jsonAsString = buildJSONString(json)

        try {
            with(url.openConnection() as HttpURLConnection) {
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
        }catch(e : Exception){
            Log.d("NetworkUtility", "Upload Error")
        }
    }
}


}


