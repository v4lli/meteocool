package com.meteocool.security

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.support.v4.app.ActivityCompat
import android.support.v4.content.ContextCompat

class Validator{
companion object {

    private const val PERMISSION_REQUEST_LOCATION = 34

     fun checkAndroidPermissions(context: Context, activity: Activity) {
        // Here, thisActivity is the current activity
        if (ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            )
            != PackageManager.PERMISSION_GRANTED
        ) {
            ActivityCompat.requestPermissions(
                activity,
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

    fun isLocationPermissionGranted(context : Context) : Boolean{
       return ContextCompat.checkSelfPermission(
                context,
                Manifest.permission.ACCESS_FINE_LOCATION
            )== PackageManager.PERMISSION_GRANTED

    }
}
}
