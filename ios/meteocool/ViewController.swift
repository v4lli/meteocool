import UIKit
import WebKit
import CoreLocation

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler, CLLocationManagerDelegate, LocationObserver {
    @IBOutlet weak var webView: WKWebView!

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

    func notify(location: CLLocation) {
        NSLog("injecting location update")
        webView.evaluateJavaScript("window.injectLocation(\(location.coordinate.latitude), \(location.coordinate.longitude), \(location.horizontalAccuracy));")
    }

    /* called from javascript */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = String(describing: message.body)
        NSLog(action)

        if action == "darkmode" {
            toggleDarkMode()
        }
        if action == "lightmode" {
            toggleLightMode()
        }

        if action == "startMonitoringLocation" {
            SharedLocationUpdater.requestLocation(observer: self)
            SharedLocationUpdater.startAccurateLocationUpdates()
        }
        if action == "stopMonitoringLocation" {
            SharedLocationUpdater.stopAccurateLocationUpdates()
        }

        if action == "openSettingsView" {
            // XXX implement me
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

    override func loadView() {
        super.loadView()
        webView?.configuration.userContentController.add(self, name: "scriptHandler")
        self.view.addSubview(webView!)
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

        NotificationCenter.default.addObserver(self, selector: #selector(ViewController.willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        SharedLocationUpdater.addObserver(observer: self)
    }

    @objc func willEnterForeground() {
        // reload tiles if app resumes from background
        webView.evaluateJavaScript("window.manualTileUpdateFn(true);")
    }
}

extension WKWebView {
    override open var safeAreaInsets: UIEdgeInsets {
        return UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
    }
}
