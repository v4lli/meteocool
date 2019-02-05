package org.unimplemented.meteocool.location

import android.location.Location
import android.location.LocationListener
import android.os.Bundle
import android.util.Log

class MyLocationListener : LocationListener {
    override fun onLocationChanged(location: Location?) {
        Log.d("LocationListener", "$location changed")
        if (location != null) {
            UploadLocation().execute(location)
        }
    }

    override fun onStatusChanged(provider: String?, status: Int, extras: Bundle?) {
        Log.d("LocationListener", "$provider onStatusChanged")
    }

    override fun onProviderEnabled(provider: String?) {
        Log.d("LocationListener", "$provider onEnabled")
    }

    override fun onProviderDisabled(provider: String?) {
        Log.d("LocationListener", "$provider onDisabled")
    }
}
