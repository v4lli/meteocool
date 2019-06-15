import UIKit
import CoreLocation

protocol LocationObserver {
    func notify(location: CLLocation)
}

let SharedLocationUpdater = LocationUpdater.init()

// XXX is there a way to make this class not instanciable? it should be a singleton (FUCKING JAVA BROKE ME)
class LocationUpdater: NSObject, CLLocationManagerDelegate {
    /// location manager instace we're wrapping
    private let locationManager: CLLocationManager = CLLocationManager()
    /// device identifier (currently unused...)
    private let deviceID: String = UIDevice.current.identifierForVendor!.uuidString
    /// pressure manager object
    private let pressure: PressureManager = PressureManager()
    /// Location observers (only notified if app is active and a new location update becomes available)
    private var observers = [LocationObserver]()

    // accurate location updates are/were enabled before suspend
    private var accurateLocationUpdatesEnabled: Bool = false

    // the last location reported to the backend
    private var lastPostedLocation: CLLocation?
    // the last received location (might not have been reported to the backend)
    private var lastReceivedLocation: CLLocation?

    /// default accuracy for monitoring significant location changes
    private let backgroundAccuracy = kCLLocationAccuracyKilometer

    /// populated with the completion handler from the onboarding thing
    var authCompletionHandler: ((Bool, Error?) -> Void)?

    /// constructor
    override init() {
        super.init()
        locationManager.delegate = self
        NotificationCenter.default.addObserver(self, selector: #selector(LocationUpdater.willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        NotificationCenter.default.addObserver(self, selector: #selector(LocationUpdater.willResignActive), name: UIApplication.willResignActiveNotification, object: nil)
        printAuthorizationStatus()
    }

    func printAuthorizationStatus() {
        if CLLocationManager.locationServicesEnabled() {
            switch CLLocationManager.authorizationStatus() {
            case .notDetermined, .restricted, .denied:
                NSLog("Location: No access")
            case .authorizedWhenInUse:
                NSLog("Location: WhenInUse")
            case .authorizedAlways:
                NSLog("Location: Always")
                startSignificantChangeLocationUpdates()
            @unknown default:
                NSLog("Location: unknown case")
            }
        } else {
            NSLog("Location services are not enabled")
        }
    }

    func requestAuthorization(_ completion: @escaping (_ success: Bool, _ error: Error?) -> Void, notDetermined: Bool) {
        authCompletionHandler = completion
        locationManager.requestAlwaysAuthorization()
        if (!notDetermined) {
            // XXX this crap needs to go into the completion handler by the ONLY caller that ever sets this awfully named
            // second parameter to false. WTF WAS I THINKING
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(1), execute: {
                print("completing lost completion handler")
                if let authCompletionHandler = self.authCompletionHandler {
                    authCompletionHandler(true, nil)
                }
                self.authCompletionHandler = nil
            })
        }
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        if let authCompletionHandler = authCompletionHandler {
            switch status {
            case .notDetermined:
                locationManager.requestAlwaysAuthorization()
                break
            case .authorizedWhenInUse:
                locationManager.startUpdatingLocation()
                break
            case .authorizedAlways:
                locationManager.startUpdatingLocation()
                SharedNotificationManager.registerForPushNotifications({(_,_) in })
                break
            case .restricted:
                break
            case .denied:
                break
            default:
                break
            }
            authCompletionHandler(true, nil)
        }
        authCompletionHandler = nil
    }

    // =============== Observer pattern ===========
    func addObserver(observer: LocationObserver) {
        observers.append(observer)
    }

    // executed when the user taps the locate-me button
    func requestLocation(observer: LocationObserver, explicit: Bool) {
        if (explicit) {
            if (CLLocationManager.authorizationStatus() == .notDetermined) {
                requestAuthorization({(_,_) in
                    if CLLocationManager.authorizationStatus() == .authorizedAlways || CLLocationManager.authorizationStatus() == .authorizedWhenInUse {
                        self.requestLocation(observer: observer, explicit: false)
                    }
                }, notDetermined: true)
            }
            if (CLLocationManager.authorizationStatus() == .denied) {
                if let url = NSURL(string: UIApplication.openSettingsURLString) as URL? {
                    UIApplication.shared.open(url, options: [:], completionHandler: nil)
                }
            }
        }

        if let location = self.lastReceivedLocation {
            observer.notify(location: location)
        } else {
            NSLog("location requested by observer, but none cached!")
        }
    }

    // =============== Notification center callbacks ==========
    @objc func willResignActive() {
        if (accurateLocationUpdatesEnabled) {
            self.locationManager.stopUpdatingLocation()
        }
        locationManager.desiredAccuracy = backgroundAccuracy
        startSignificantChangeLocationUpdates()
    }

    @objc func willEnterForeground() {
        if (accurateLocationUpdatesEnabled) {
            startAccurateLocationUpdates()
        }
    }

    // setters to change between various location modes
    func startSignificantChangeLocationUpdates() {
        self.locationManager.allowsBackgroundLocationUpdates = true
        self.locationManager.startMonitoringSignificantLocationChanges()
    }

    /* unused */
    /*func startBackgroundLocationUpdates() {
        self.locationManager.allowsBackgroundLocationUpdates = true
        self.locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
        self.locationManager.pausesLocationUpdatesAutomatically = true
        self.locationManager.activityType = CLActivityType.other
        self.locationManager.startUpdatingLocation()
    }*/

    func startAccurateLocationUpdates() {
        if UIApplication.shared.applicationState != .active {
            return
        }

        self.locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        self.locationManager.pausesLocationUpdatesAutomatically = true
        self.locationManager.activityType = CLActivityType.other
        self.locationManager.startUpdatingLocation()
        accurateLocationUpdatesEnabled = true
    }

    func stopAccurateLocationUpdates() {
        self.locationManager.stopUpdatingLocation()
        accurateLocationUpdatesEnabled = false
    }

    // helper method to decide whether a new location is significant enough to be reported
    // to the backend.
    private func decideSignificantChange(old: CLLocation?, new: CLLocation?) -> Bool {
        if let old = old, let new = new {
            if new.verticalAccuracy + 1 < old.verticalAccuracy {
                return true
            }
            if new.distance(from: old) > 500 {
                return true
            }
            return false
        } else {
            return true
        }
    }

    // delegate method called when new location events are available (background and foreground location)
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        var background = true
        if UIApplication.shared.applicationState == .active {
            background = false
        }

        if let location = locations.last {
            if (background || decideSignificantChange(old: self.lastPostedLocation, new: location)) {
                // take pressure measurement and send json request
                pressure.getPressure(completion: {
                    pressure in self.postLocationDeferred(location: location, pressure: pressure)  })
                self.lastPostedLocation = location
            }

            UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(location.coordinate.latitude, forKey: "lat")
            UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(location.coordinate.longitude, forKey: "lon")
            UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(location.coordinate.longitude, forKey: "accuracy")

            // XXX decide if new location is better than the previous one. does apple guarantee this??
            // XXX apparently not
            self.lastReceivedLocation = location
            if (!background) {
                for observer in observers {
                    observer.notify(location: location)
                }

                if location.horizontalAccuracy <= 20 {
                    locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
                }
            }
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        NSLog("CLLocationManager error: \(error)")
    }

    // interface methods to the backend
    func postLocationDeferred(location: CLLocation, pressure: Float) {
        // XXX not sure we need this hack... if there is no token, don't use background location stuff
        if SharedNotificationManager.getToken() != nil {
            postLocation(location: location, pressure: pressure)
        } else {
            DispatchQueue.main.asyncAfter(deadline: .now() + .seconds(4), execute: {
                self.postLocation(location: location, pressure: pressure)
            })
        }
    }

    func postLocation(location: CLLocation, pressure: Float) {
        let tokenValue = SharedNotificationManager.getToken() ?? "anon"

        var lang = "en"
        if let bundle_lang = Bundle.main.preferredLocalizations.first {
            lang = bundle_lang
        }

        let locationDict = [
            "lat": location.coordinate.latitude as Double,
            "lon": location.coordinate.longitude as Double,
            "lang": lang,
            "altitude": location.altitude as Double,
            "accuracy": location.horizontalAccuracy as Double,
            "verticalAccuracy": location.verticalAccuracy as Double,
            "speed": location.speed as Double,
            "course": location.course as Double,
            "pressure": pressure,
            "timestamp": location.timestamp.timeIntervalSince1970 as Double,
            "ahead": 15,
            "intensity": 10,
            "source": "ios",
            "token": tokenValue,
            ] as [String: Any]

        guard let request = NetworkHelper.createJSONPostRequest(dst: "post_location", dictionary: locationDict) else {
            return
        }

        let task = URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = NetworkHelper.checkResponse(data: data, response: response, error: error) else {
                return
            }

            if let json = ((try? JSONSerialization.jsonObject(with: data, options: []) as? [String: Any]) as [String : Any]??) {
                if let errorMessage = json?["error"] as? String {
                    NSLog("ERROR: \(errorMessage)")
                }
            }
        }
        task.resume()
    }
}
