import UIKit
import UIKit.UIGestureRecognizer
import WebKit
import CoreLocation

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler, LocationObserver{
    let buttonsize = 19.0 as CGFloat

    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var sliderView: UIView!
    @IBOutlet weak var slider_ring: UIImageView!
    @IBOutlet weak var slider_button: UIImageView!
    @IBOutlet weak var button: UIButton!
    @IBOutlet weak var time: UILabel!

    var path: UIBezierPath!
    var slider_shown: Bool = false
    var color: [Int] = []
    var currentdate = Date()
    let formatter = DateFormatter()
    
    @IBAction func slider_showen_button(sender: AnyObject) {
                if(slider_shown) {
                    time.isHidden = true
                    slider_ring.isHidden = true
                    slider_button.isHidden = true
                    slider_shown = false
                    webView.evaluateJavaScript("window.resetLayers();")
                } else {
                    //move_slider_button(pointToMove: CGPoint.init(x: UIScreen.main.bounds.width, y: UIScreen.main.bounds.height-268))
                    move_slider_button(pointToMove: CGPoint.init(x: 150-140*cos(52/180*Double.pi), y: 150-140*sin(52/180*Double.pi)))
                    slider_ring.isHidden = false

                    let webkitFunction = """
window.downloadForecast(function() {
    window.forecastDownloaded = true;
    window.webkit.messageHandlers["scriptHandler"].postMessage("forecastDownloaded");
});
"""
                    //print(webkitFunction)
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
        NSLog(action)
        NSLog(message.name)

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
            time.text = formatter.string(from: currentdate)
            slider_button.isHidden = false
            slider_shown = true
            time.isHidden = false
        }
        
        if action == "forecastInvalid"{
            slider_button.isHidden = true
            slider_ring.isHidden = true
            slider_shown = false
            time.isHidden = true
            webView.evaluateJavaScript("window.resetLayers();")
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
        self.view.addSubview(time!)
        self.view.addSubview(sliderView!)
        self.sliderView.addSubview(slider_ring!)
        self.sliderView.addSubview(slider_button!)
        self.sliderView.addSubview(button!)

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
