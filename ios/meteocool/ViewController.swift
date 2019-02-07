import UIKit
import WebKit
import CoreLocation

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler, CLLocationManagerDelegate {
    @IBOutlet weak var webView: WKWebView!
    let locationManager: CLLocationManager = CLLocationManager()
    var lastLocation: CLLocation!

    func toggleDarkMode() {
        // #343a40 = darkmode titelbar color
        let darkmode = UIColor(red: 0x34/255.0, green: 0x3a/255.0, blue: 0x40/255.0, alpha: 1.0)
        UIApplication.shared.statusBarView?.backgroundColor = darkmode
    }

    func toggleLightMode() {
        // #f8f9fa = non-darkmode titelbar color
        let lightmode = UIColor(red: 0xf8/255.0, green: 0xf9/255.0, blue: 0xfa/255.0, alpha: 1.0)
        UIApplication.shared.statusBarView?.backgroundColor = lightmode
    }

    func injectLocationUpdate() {
        if let location = self.lastLocation {
            NSLog("injecting location update")
            webView.evaluateJavaScript("window.injectLocation(\(location.coordinate.latitude), \(location.coordinate.longitude), \(location.horizontalAccuracy));")

            if location.horizontalAccuracy <= 20 {
                locationManager.desiredAccuracy = kCLLocationAccuracyKilometer
            }
        }

    }

    /* called from javascript */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = String(describing: message.body)

        if action == "darkmode" {
            toggleDarkMode()
        }
        if action == "lightmode" {
            toggleLightMode()
        }

        if action == "startMonitoringLocation" {
            locationManager.desiredAccuracy = kCLLocationAccuracyNearestTenMeters
            locationManager.startUpdatingLocation()
            injectLocationUpdate()
        }
        if action == "stopMonitoringLocation" {
            locationManager.stopUpdatingLocation()
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let clErr = error as? CLError {
            switch clErr {
            case CLError.locationUnknown:
                print("location unknown")
            case CLError.denied:
                print("denied")
            default:
                print("other Core Location error")
            }
        } else {
            print("other error:", error.localizedDescription)
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if let location = locations.last {
            self.lastLocation = location;
            self.injectLocationUpdate()
        }
    }

    override func loadView() {
        super.loadView()
        webView?.configuration.userContentController.add(self, name: "scriptHandler")
        self.view.addSubview(webView!)

        locationManager.delegate = self
        locationManager.requestAlwaysAuthorization()
        if CLLocationManager.locationServicesEnabled() {
            switch CLLocationManager.authorizationStatus() {
            case .notDetermined, .restricted, .denied:
                NSLog("Location WebView: No access")
            case .authorizedWhenInUse:
                NSLog("Location WebView: WhenInUse")
            case .authorizedAlways:
                NSLog("Location WebView: Always")
            }
        } else {
            NSLog("Location services are not enabled")
        }
        locationManager.desiredAccuracy = kCLLocationAccuracyHundredMeters
        locationManager.pausesLocationUpdatesAutomatically = true
        locationManager.activityType = CLActivityType.other
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // disable scrolling & bouncing effects
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false

        toggleLightMode()

        if let url = URL(string: "https://meteocool.unimplemented.org/?mobile=ios2") {
            let request = URLRequest(url: url)
            webView.load(request)
        }

        // reload tiles if app resumes from background
        NotificationCenter.default.addObserver(self, selector: #selector(ViewController.reloadTiles), name: UIApplication.willEnterForegroundNotification, object: nil)
    }

    @objc func reloadTiles() {
        webView.evaluateJavaScript("window.manualTileUpdateFn(true);")
    }
}

extension WKWebView {
    override open var safeAreaInsets: UIEdgeInsets {
        return UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
    }
}
