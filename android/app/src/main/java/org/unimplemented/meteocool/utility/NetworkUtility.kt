package org.unimplemented.meteocool.utility

import android.util.Log
import com.google.gson.Gson
import org.unimplemented.meteocool.Meteocool
import java.io.*
import java.net.HttpURLConnection
import java.net.URL

class NetworkUtility{
companion object {

    private fun buildJSON(json : JSONPost) : String{
        val gsonBuilder = Gson().newBuilder().create()
        val jsonAsString = gsonBuilder.toJson(json)
        Log.d("JSON", jsonAsString)
        return jsonAsString
    }

    fun sendPostRequest(json : JSONPost) {

        val mURL = URL(Meteocool.REST_URL)

        with(mURL.openConnection() as HttpURLConnection) {
            // optional default is GET
            requestMethod = "POST"
            setRequestProperty("charset", "utf-8")
            setRequestProperty("Content-lenght", buildJSON(json).length.toString())
            setRequestProperty("Content-Type", "application/json")

            val wr = OutputStreamWriter(outputStream)

            val buffer = ByteArrayOutputStream()
            val oos = ObjectOutputStream(buffer)

            wr.write(buildJSON(json))
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


}


