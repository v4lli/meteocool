import UIKit
import UIKit.UIGestureRecognizer
import WebKit
import CoreLocation

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler, LocationObserver{
    let buttonsize = 19.0 as CGFloat

    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var slider_ring: UIImageView!
    @IBOutlet weak var slider_button: UIImageView!
    @IBOutlet weak var button: UIButton!
    @IBOutlet weak var time: UILabel!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!

    enum DrawerStates {
        case CLOSED
        case LOADING
        case OPEN
    }

    var drawerState = DrawerStates.CLOSED
    var originalButtonPosition: CGRect!

    var currentdate = Date()
    let formatter = DateFormatter()

    func drawer_open() {
        if (drawerState == .CLOSED) {
            activityIndicator.startAnimating()
            button.alpha = 0.5
            move_slider_button(pointToMove: CGPoint.init(x: UIScreen.main.bounds.width, y: 209))
            drawerState = .LOADING
        }
        if (originalButtonPosition == nil) {
            originalButtonPosition = button.frame
        }
    }

    func drawer_open_finish() {
        if (drawerState == .LOADING) {
            slider_button.isHidden = false
            slider_ring.isHidden = false
            time.isHidden = false
            button.alpha = 1
            button.frame = CGRect(x: button.frame.origin.x-(button.frame.width/2), y: button.frame.origin.y, width: button.frame.width*2, height: button.frame.height)
            button.setImage(UIImage(named: "Slider_Handle_open"), for: [])
            activityIndicator.stopAnimating()
            drawerState = .OPEN
        }
    }

    func drawer_close() {
        time.isHidden = true
        slider_ring.isHidden = true
        slider_button.isHidden = true
        button.alpha = 1.0

        if (drawerState == .OPEN) {
            button.setImage(UIImage(named: "Slider_Handle"), for: [])
            button.frame = originalButtonPosition
            //CGRect(x: button.frame.origin.x+(button.frame.width/2), y: button.frame.origin.y, width: button.frame.width/2, height: button.frame.height)
        }
        activityIndicator.stopAnimating()
        drawerState = .CLOSED
    }

    @IBAction func slider_show_button(sender: AnyObject) {
        if (drawerState == .OPEN) {
            // hide drawer
            webView.evaluateJavaScript("window.resetLayers();")
            drawer_close()
        } else if (drawerState == .CLOSED) {
            // show drawer (in loading mode)
            drawer_open()

            let webkitFunction = """
window.downloadForecast(function() {
    window.forecastDownloaded = true;
    window.webkit.messageHandlers["scriptHandler"].postMessage("forecastDownloaded");
});
"""
            webView.evaluateJavaScript(webkitFunction)
        }
    }

    func move_slider_button(pointToMove: CGPoint) {
        let x_coordiante = (pointToMove.x)-(buttonsize/2)
        let y_coordinate = (pointToMove.y)-(buttonsize/2)

        slider_button.frame.origin = CGPoint(x: x_coordiante, y: y_coordinate)
    }

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
        webView.evaluateJavaScript("window.injectLocation(\(location.coordinate.latitude), \(location.coordinate.longitude), \(location.horizontalAccuracy));")
    }

    /* called from javascript */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = String(describing: message.body)

        if message.name == "timeHandler" {
            self.currentdate = NSDate(timeIntervalSince1970: Double(action)!) as Date
        }

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

        if action == "forecastDownloaded" {
            //print("forecast finished downloading")
            time.text = formatter.string(from: Date())
            drawer_open_finish()
        }

        if action == "forecastInvalid" {
            drawer_close()
        }

        if action == "openSettingsView" {
            // XXX implement me
        }
    }

    override func loadView() {
        super.loadView()
        webView?.configuration.userContentController.add(self, name: "scriptHandler")
        webView?.configuration.userContentController.add(self, name: "timeHandler")
        self.view.addSubview(webView!)
        self.view.addSubview(slider_ring!)
        self.view.addSubview(slider_button!)
        self.view.addSubview(button!)
        self.view.addSubview(time!)
        self.view.addSubview(activityIndicator!)

        time.isHidden = true
        time.layer.masksToBounds = true
        time.layer.cornerRadius = 8.0
        slider_ring.isHidden = true
        slider_button.isHidden = true

        formatter.locale = Locale(identifier: "de_De")
        formatter.dateFormat = "H:mm"

        let gesture = CustomGestureRecognizer(target: self, action: nil)
        gesture.setView(viewing: self)
        view.addGestureRecognizer(gesture)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // disable scrolling & bouncing effects
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.bounces = false

        toggleLightMode()

        if let url = URL(string: "https://meteocool.com/?mobile=ios2") {
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
