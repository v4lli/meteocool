package org.unimplemented.meteocool.location

import android.Manifest
import android.app.Service
import android.content.Intent
import android.content.pm.PackageManager
import android.content.res.Configuration
import android.location.LocationManager
import android.os.IBinder
import android.support.v4.content.ContextCompat
import android.util.Log

class MyLocationService : Service(){
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.e("Location", "onStartCommand")
        super.onStartCommand(intent, flags, startId)
        return START_STICKY
    }

    companion object {
        private const val MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS : Long = 5000
        private const val MIN_DISTANCE_LOCATION_UPDATE_METER = 10f
    }

    private val locationManager = getSystemService(LOCATION_SERVICE) as (LocationManager)
    private val locationListener = MyLocationListener()

    override fun onConfigurationChanged(newConfig: Configuration?) {
        super.onConfigurationChanged(newConfig)

        if (ContextCompat.checkSelfPermission(this,Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            Log.d("Location", "Entered location block")
            locationManager.requestLocationUpdates(
                LocationManager.GPS_PROVIDER,
                MIN_TIME_INTERVAL_LOCATION_UPDATE_MILIS,
                MIN_DISTANCE_LOCATION_UPDATE_METER, locationListener
            )
        }
    }

    override fun onBind(intent: Intent?): IBinder? {
        TODO("not implemented") //To change body of created functions use File | Settings | File Templates.
    }

    override fun onCreate() {
        super.onCreate()
        if (ContextCompat.checkSelfPermission(this,Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            Log.d("Location", "Entered location block")
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 5000, 10f, locationListener)
        }
    }
}
