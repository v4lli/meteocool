import UIKit
import WebKit
import UIKit.UIGestureRecognizer

class ViewController: UIViewController, WKUIDelegate, WKScriptMessageHandler {
    var buttonsize = 19.0 as CGFloat
    
    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var slider_ring: UIImageView!
    @IBOutlet weak var slider_button: UIImageView!

    func move_slider_button(pointToMove: CGPoint){
        let x_coordiante = (pointToMove.x)-(buttonsize/2)
        let y_coordinate = (pointToMove.y)-(buttonsize/2)
        slider_button.frame.origin = CGPoint(x:x_coordiante,y:y_coordinate)
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

    /* called from javascript */
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        let action = String(describing: message.body)

        if action == "darkmode" {
            toggleDarkMode()
        }
        if action == "lightmode" {
            toggleLightMode()
        }
    }

    override func loadView() {
        super.loadView()
        webView?.configuration.userContentController.add(self, name: "scriptHandler")
        self.view.addSubview(webView!)
        self.view.addSubview(slider_ring!)
        self.view.addSubview(slider_button!)
        
        let gesture = CustomGestureRecognizer(target: self, action: nil)
        gesture.setView(viewing: self)
        view.addGestureRecognizer(gesture) // #selector(UIViewController.viewDidLoad)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        // disable scrolling & bouncing effects
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false

        toggleLightMode()

        if let url = URL(string: "https://meteocool.unimplemented.org/?mobile=ios") {
            let request = URLRequest(url: url)
            webView.load(request)
        }

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
