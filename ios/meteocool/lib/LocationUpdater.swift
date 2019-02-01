import UIKit
import CoreLocation
import CoreMotion

let NUM_PRESSURE_MEASUREMENTS = 3

class LocationUpdater: NSObject, CLLocationManagerDelegate {
    let locationManager: CLLocationManager
    lazy var altimeter = CMAltimeter()
    let deviceID: String = UIDevice.current.identifierForVendor!.uuidString
    var token: String?
    var averagePressure: Double
    var pressureMeasurements: Int

    override init() {
        locationManager = CLLocationManager()
        averagePressure = 0
        pressureMeasurements = 0
        super.init()

        locationManager.delegate = self
        locationManager.requestAlwaysAuthorization()

        if CLLocationManager.locationServicesEnabled() {
            switch CLLocationManager.authorizationStatus() {
            case .notDetermined, .restricted, .denied:
                NSLog("Location: No access")
            case .authorizedWhenInUse:
                NSLog("Location: WhenInUse")
            case .authorizedAlways:
                NSLog("Location: Always")
                startSignificantChangeLocationUpdates()
            }
        } else {
            NSLog("Location services are not enabled")
        }
    }

    func startSignificantChangeLocationUpdates() {
        self.locationManager.allowsBackgroundLocationUpdates = true
        self.locationManager.startMonitoringSignificantLocationChanges()
    }

    func startBackgroundLocationUpdates() {
        self.locationManager.allowsBackgroundLocationUpdates = true
        self.locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
        self.locationManager.pausesLocationUpdatesAutomatically = true
        self.locationManager.activityType = CLActivityType.other
        self.locationManager.startUpdatingLocation()
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.last {
            if (CMAltimeter.isRelativeAltitudeAvailable()) {
                // we have a location fix, now read a few values from the altimeter
                self.averagePressure = 0
                self.pressureMeasurements = 0
                self.altimeter.startRelativeAltitudeUpdates(to: OperationQueue.main, withHandler: { (altitudeData:CMAltitudeData?, error:Error?) in
                    guard let altitudeData = altitudeData else {
                        self.altimeter.stopRelativeAltitudeUpdates()
                        NSLog("Error reading altimeter despite reported as available")
                        return
                    }
                    // not sure if necessary to avoid processing old OperationQueue items.
                    if (self.pressureMeasurements >= NUM_PRESSURE_MEASUREMENTS) {
                        return
                    }

                    // average over the last n measurements
                    // XXX time will tell if this is really necessary... the altimeter is very accurate, so it might not be necessary
                    // to take an average. remove if battery usage is a concern.
                    let measurement = altitudeData.pressure.doubleValue * 10
                    if (self.pressureMeasurements == 0) {
                        self.averagePressure = measurement
                    } else {
                        self.averagePressure = (self.averagePressure + measurement) / 2
                    }
                    self.pressureMeasurements += 1

                    if (self.pressureMeasurements == NUM_PRESSURE_MEASUREMENTS) {
                        NSLog("Average pressure (%d measurements): %f", NUM_PRESSURE_MEASUREMENTS, self.averagePressure)
                        self.altimeter.stopRelativeAltitudeUpdates()
                        self.postLocationDeferred(location: location, pressure: self.averagePressure)
                    }
                })
            } else {
                self.postLocationDeferred(location:location, pressure: -1)
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        NSLog("CLLocationManager ERR: \(error)")
    }

    func postLocationDeferred(location: CLLocation, pressure: Double) {
        if token != nil {
            postLocation(location: location, pressure: pressure)
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(4), execute: {
                self.postLocation(location: location, pressure: pressure)
            })
        }
    }

    func postLocation(location: CLLocation, pressure: Double) {
        let tokenValue = self.token ?? "anon";

        let locationDict = [
            "lat": location.coordinate.latitude as Double,
            "lon": location.coordinate.longitude as Double,
            "altitude": location.altitude as Double,
            "accuracy": location.horizontalAccuracy as Double,
            "verticalAccuracy": location.verticalAccuracy as Double,
            "speed": location.speed as Double,
            "course": location.course as Double,
            "pressure": pressure,
            "timestamp": location.timestamp.timeIntervalSince1970 as Double,
            "ahead": 15,
            "intensity": 10,
            "source" : "ios",
            "token" : tokenValue,
            ] as [String : Any]

        guard let request = NetworkHelper.createJSONPostRequest(dst: "post_location", dictionary: locationDict) else {
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = NetworkHelper.checkResponse(data: data, response: response, error: error) else {
                return
            }

            if let json = try? JSONSerialization.jsonObject(with: data, options: []) as? [String:Any] {
                if let errorMessage = json?["error"] as? String {
                    NSLog("ERROR: \(errorMessage)")
                }
            }
        }
        task.resume()
    }
}
