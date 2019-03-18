import UIKit
import NotificationCenter
import WebKit

class TodayViewController: UIViewController, NCWidgetProviding {
    @IBOutlet weak var webView: WKWebView!
    @IBOutlet weak var umbrella: UIImageView!
    @IBOutlet weak var message_box: UITextView!
    @IBOutlet weak var alert_box: UITextField!

    override func loadView() {
        super.loadView()
        self.view.addSubview(webView)
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        webView.scrollView.isUserInteractionEnabled = false
        extensionContext?.widgetLargestAvailableDisplayMode = .expanded
    }

    func widgetPerformUpdate(completionHandler: (@escaping (NCUpdateResult) -> Void)) {
        if let lat = UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "lat") {
            if let lon = UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "lon") {
                //print("https://meteocool.unimplemented.org/?mobile=ios_widget#widgetMap=9.5f/\(lat)/\(lon)/0")
                if let url = URL(string: "https://meteocool.unimplemented.org/?mobile=ios_widget#widgetMap=9.5f/\(lat)/\(lon)/0") {
                    let request = URLRequest(url: url)
                    webView.load(request)
                }
            }
        }
        completionHandler(NCUpdateResult.newData)
    }

    func widgetActiveDisplayModeDidChange(_ activeDisplayMode: NCWidgetDisplayMode,
                                          withMaximumSize maxSize: CGSize) {
        if activeDisplayMode == NCWidgetDisplayMode.compact {
            self.preferredContentSize = CGSize(width: maxSize.width, height: 110)
        } else {
            self.preferredContentSize = CGSize(width: maxSize.width, height: 359)
        }
        self.webView.frame.size = webView.sizeThatFits(self.preferredContentSize)
    }
}
