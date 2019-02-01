//
//  TodayViewController.swift
//  Widget
//
//  Created by Nina Loser on 01.02.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import UIKit
import NotificationCenter
import WebKit

class TodayViewController: UIViewController, NCWidgetProviding {
    @IBOutlet weak var webView: WKWebView!
    
    override func loadView() {
        super.loadView()
        self.view.addSubview(webView)
    }
        
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.bounces = false
        
        print ("test")
        
        
        if let lat = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "lat"){
             if let lon = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "lon"){
                print (lat)
                print (lon)
                if let url = URL(string: "https://meteocool.unimplemented.org/?mobile=ios#map=10/1286594.33/6132530.21/0") {
                    let request = URLRequest(url: url)
                    webView.load(request)
                }
            }
        }
        
        extensionContext?.widgetLargestAvailableDisplayMode = .expanded
    }
        
    func widgetPerformUpdate(completionHandler: (@escaping (NCUpdateResult) -> Void)) {
        // Perform any setup necessary in order to update the view.
        
        // If an error is encountered, use NCUpdateResult.Failed
        // If there's no update required, use NCUpdateResult.NoData
        // If there's an update, use NCUpdateResult.NewData
        
        completionHandler(NCUpdateResult.newData)
    }
    
    func widgetActiveDisplayModeDidChange(_ activeDisplayMode: NCWidgetDisplayMode, withMaximumSize maxSize: CGSize) {
        let expanded = activeDisplayMode == .expanded
        preferredContentSize = expanded ? CGSize(width: maxSize.width, height: 400) : maxSize
    }

    
}
