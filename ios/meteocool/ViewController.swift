import UIKit
import UIKit.UIGestureRecognizer
import WebKit
import CoreLocation
import OnboardKit

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler, LocationObserver{
    let buttonsize = 19.0 as CGFloat
    let lightmode = UIColor(red: 0xf8/255.0, green: 0xf9/255.0, blue: 0xfa/255.0, alpha: 1.0)

    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var slider_ring: UIImageView!
    @IBOutlet weak var slider_button: UIImageView!
    @IBOutlet weak var button: UIButton!
    @IBOutlet weak var time: UILabel!
    @IBOutlet weak var activityIndicator: UIActivityIndicatorView!

    var onboardingOnThisRun = false

    enum DrawerStates {
        case CLOSED
        case LOADING
        case OPEN
    }

    var drawerState = DrawerStates.CLOSED
    var originalButtonPosition: CGRect!

    var currentdate = Date()
    let formatter = DateFormatter()

    func drawer_show() {
        button.isHidden = false
    }

    func drawer_hide() {
        button.isHidden = true
    }

    func drawer_open() {
        if (drawerState == .CLOSED) {
            activityIndicator.startAnimating()
            button.alpha = 0.5
            move_slider_button(pointToMove: CGPoint.init(x: UIScreen.main.bounds.width, y: 209))
            drawerState = .LOADING
            button.isEnabled = false
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
            // XXX workaround until we tie the play button to the wheel
            webView.evaluateJavaScript("window.hidePlayButton();")
            button.isEnabled = true
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
        }
        activityIndicator.stopAnimating()
        drawerState = .CLOSED
        // XXX workaround until we tie the play button to the wheel
        webView.evaluateJavaScript("window.showPlayButton();")
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
        UIApplication.shared.statusBarView?.backgroundColor = lightmode
    }

    func notify(location: CLLocation) {
        webView.evaluateJavaScript("window.injectLocation(\(location.coordinate.latitude), \(location.coordinate.longitude), \(location.horizontalAccuracy));")
    }

    /* called from javascript */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = String(describing: message.body)

        // XXX convert to switch/case

        if message.name == "timeHandler" {
            self.currentdate = NSDate(timeIntervalSince1970: Double(action)!) as Date
        }

        if action == "darkmode" {
            toggleDarkMode()
        }
        if action == "lightmode" {
            toggleLightMode()
        }

        if action == "startMonitoringLocationExplicit" {
            SharedLocationUpdater.requestLocation(observer: self, explicit: true)
            SharedLocationUpdater.startAccurateLocationUpdates()
        }

        if action == "startMonitoringLocationImplicit" {
            SharedLocationUpdater.requestLocation(observer: self, explicit: false)
            SharedLocationUpdater.startAccurateLocationUpdates()
        }

        if action == "stopMonitoringLocation" {
            SharedLocationUpdater.stopAccurateLocationUpdates()
        }

        if action == "forecastDownloaded" {
            time.text = formatter.string(from: Date())
            drawer_open_finish()
        }

        if action == "forecastInvalid" {
            drawer_close()
        }

        if action == "enableScrolling" {
            webView.scrollView.isScrollEnabled = true
            webView.scrollView.bounces = true
        }

        if action == "disableScrolling" {
            webView.scrollView.isScrollEnabled = false
            webView.scrollView.bounces = false
        }

        if action == "drawerHide" {
            drawer_hide()
        }

        if action == "drawerShow" {
            drawer_show()
        }
    }

    lazy var onboardingPages: [OnboardPage] = {
        let pageOne = OnboardPage(
            title: NSLocalizedString("Hi there!\n\n\n", comment:"Welcome title"),
            imageName: "ob_rain_sun",
            description: NSLocalizedString("The meteocool project is an ongoing effort to make freely available meteorological data useful to everyone.\n\nWe process and aggregate data from different sources and try to visualize them in an intuitive way.", comment: "Welcome description")
        )

        let pageTwo = OnboardPage(
            title: NSLocalizedString("Nowcasting", comment:"Nowcasting title"),
            imageName: "ob_jacket",
            description: NSLocalizedString("We use a super-accurate forecast model (a so-called \"nowcast\") which predicts the path and extent of rain clouds based on factors like wind, air pressure and lightning activity.\n\nObviously, more distant time steps are less accurate. But in our experience, at least the first 45 minutes are pretty spot-on.", comment: "Nowcasting description")
        )

        let pageThree = OnboardPage(
            title: NSLocalizedString("Notifications", comment:"Notifications title"),
            imageName: "ob_notifications",
            description: NSLocalizedString("Based on this data, do you want us to notify you ahead of rain at your location?\n\nWe put a lot of effort into making the notifications non-intrusive. They disappear as soon as it stops raining.", comment: "Notifications description"),
            advanceButtonTitle: NSLocalizedString("Later", comment:"Later"),
            actionButtonTitle: NSLocalizedString("Enable Notifications", comment:"Notifications actionButtonTitle"),
            action: { [weak self] completion in SharedNotificationManager.registerForPushNotifications(completion) }
        )

        let pageFour = OnboardPage(
            title: NSLocalizedString("Location", comment:"Location"),
            imageName: "ob_location",
            description: NSLocalizedString("Choose \"Always\" in the location permission pop-up if you want notifications to work!\n\nBut don't worry, this won't drain your battery. See for yourself in the iOS Settings after a day or two.", comment: "Location description"),
            advanceButtonTitle: NSLocalizedString("Later", comment:"Later"),
            actionButtonTitle: NSLocalizedString("Enable Location Services", comment:"Enable Location Services"),
            action: { [weak self] completion in SharedLocationUpdater.requestAuthorization(completion, notDetermined: true) }
        )

        let pageFive = OnboardPage(
            title: NSLocalizedString("Go outside and play!", comment:"Finish title"),
            imageName: "ob_free",
            description: NSLocalizedString("This service is completely free and open source. It's run and built by volunteers in their free time.\n\nWe don't want your money, just tell your friends or send us feedback!", comment: "Finish description"),
            advanceButtonTitle: NSLocalizedString("Done", comment: "done")
        )

        return [pageOne, pageTwo, pageThree, pageFour, pageFive]
    }()

    let locationNag = OnboardPage(
        title: NSLocalizedString("Location", comment:"Location"),
        imageName: "ob_location",
        description: NSLocalizedString("meteocool is much better with location data! Choose \"Always\" in the permission pop-up if you also want notifications.\n\nDon't worry, this won't drain your battery.", comment: "with location"),
        advanceButtonTitle: "",
        actionButtonTitle: NSLocalizedString("Enable Location Services", comment:"Enable Location Services"),
        action: {[self] completion in
            SharedLocationUpdater.requestAuthorization(completion, notDetermined: false)}
    )

    let locationNagSorry = OnboardPage(
        title: NSLocalizedString("We'll shut up now.", comment: "shut up"),
        imageName: "ob_location",
        description: NSLocalizedString("We won't ask you again about permissions!\n\nIf you change your mind, go to System Settings > Privacy > meteocool.", comment:"we won't ask again"),
        advanceButtonTitle: NSLocalizedString("Done", comment: "done")
    )

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
        drawer_hide()

        print("Language: " + Locale.preferredLanguages[0].split(separator: "-")[0])
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // disable scrolling & bouncing effects
        webView.scrollView.isScrollEnabled = true
        webView.scrollView.bounces = false

        toggleLightMode()

        if let url = URL(string: "https://meteocool.com/?mobile=ios3") {
            let request = URLRequest(url: url)
            webView.load(request)
        }

        NotificationCenter.default.addObserver(self, selector: #selector(ViewController.willEnterForeground), name: UIApplication.willEnterForegroundNotification, object: nil)
        SharedLocationUpdater.addObserver(observer: self)
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)

        let tintColor = UIColor(red: 137.0/255.0, green: 181.0/255.0, blue: 187.0/255.0, alpha: 1.00)
        let appearanceConfiguration = OnboardViewController.AppearanceConfiguration(tintColor: tintColor, backgroundColor: lightmode)
        if (UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "onboardingDone") == nil) {
            let onboardingVC = OnboardViewController(pageItems: onboardingPages, appearanceConfiguration: appearanceConfiguration)
            onboardingVC.modalPresentationStyle = .formSheet
            onboardingVC.presentFrom(self, animated: true)
            UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(true, forKey: "onboardingDone")
            self.onboardingOnThisRun = true
        } else {
            if (!self.onboardingOnThisRun && CLLocationManager.authorizationStatus() == .notDetermined) {
                if (UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "nagDone") == nil) {
                    let nagVC = OnboardViewController(pageItems: [locationNag, locationNagSorry], appearanceConfiguration: appearanceConfiguration)
                    nagVC.modalPresentationStyle = .formSheet
                    nagVC.presentFrom(self, animated: true)
                    UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(true, forKey: "nagDone")
                }
            }
        }
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
