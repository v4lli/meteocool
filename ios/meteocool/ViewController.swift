import UIKit
import WebKit

class ViewController: UIViewController, WKUIDelegate {
    @IBOutlet weak var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // #f8f9fa = non-darkmode titelbar color
        let lightmode = UIColor(red: 0xf8/255.0, green: 0xf9/255.0, blue: 0xfa/255.0, alpha: 1.0)
        UIApplication.shared.statusBarView?.backgroundColor = lightmode

        if let url = URL(string: "https://meteocool.unimplemented.org/") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }
}

extension WKWebView {
    override open var safeAreaInsets: UIEdgeInsets {
        return UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
    }
}
