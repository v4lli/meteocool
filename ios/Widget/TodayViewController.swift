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
    @IBOutlet weak var umbrella: UIImageView!
    @IBOutlet weak var message_box: UITextView!
    @IBOutlet weak var alert_box: UITextField!
    
    
    override func loadView() {
        super.loadView()
        self.view.addSubview(webView)
        self.view.addSubview(umbrella)
        self.view.addSubview(message_box)
        self.view.addSubview(alert_box)
    }
        
    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
        
        webView.scrollView.isUserInteractionEnabled = false
        extensionContext?.widgetLargestAvailableDisplayMode = .expanded
        umbrella.contentMode = .scaleAspectFit
    }
        
    func widgetPerformUpdate(completionHandler: (@escaping (NCUpdateResult) -> Void)) {
        completionHandler(NCUpdateResult.newData)
        
        if let alert : String = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "alert") as? String{
            umbrella.image = UIImage(named: "umbrella_open")
            if let message : String = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "message") as? String{
                alert_box.frame.origin = CGPoint(x:98,y:9)
                alert_box.text = alert
                message_box.text = message
                
                //ausklappen
                widgetActiveDisplayModeDidChange(NCWidgetDisplayMode.expanded, withMaximumSize: CGSize.init(width: 359, height: -1))
            }
        } else{
            umbrella.image = UIImage(named: "umbrella_closed")
            alert_box.text = "No rain expected!"
            alert_box.frame.origin = CGPoint(x:98,y:45)
            
            //einklappen
            widgetActiveDisplayModeDidChange(NCWidgetDisplayMode.compact, withMaximumSize: CGSize.init(width: 359, height: -1))
        }
    }
    
    func widgetActiveDisplayModeDidChange(_ activeDisplayMode: NCWidgetDisplayMode, withMaximumSize maxSize: CGSize) {
        if activeDisplayMode == NCWidgetDisplayMode.compact
        {
            //do things only seen if mode ist compact
            self.preferredContentSize = CGSize(width: maxSize.width, height: 110)
            webView.isHidden = true
            
            //Für den test
            UserDefaults.init(suiteName: "group.meteocool")?.removeObject(forKey: "alert")
            UserDefaults.init(suiteName: "group.meteocool")?.removeObject(forKey: "message")
        }
        else
        {
            //für den test
            UserDefaults.init(suiteName: "group.meteocool")?.setValue("Light rain (20 dbZ) expexted in 5 min!\n", forKey: "alert")
            UserDefaults.init(suiteName: "group.meteocool")?.setValue("Peaks with rain (29 dbZ) in 30 minutes; lasting a total of at least 90 min.", forKey: "message")
            
            //do things only seen if mode ist expand
            webView.isHidden = false
            if let lat = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "lat"){
                if let lon = UserDefaults.init(suiteName: "group.meteocool")?.value(forKey: "lon"){
                    //print (lat)
                    //print (lon)
                    if let url = URL(string: "https://meteocool.unimplemented.org/?mobile=ios_widget#widgetMap=9.5f/\(lat)/\(lon)/0") {
                        let request = URLRequest(url: url)
                        webView.load(request)
                    }
                }
            }
            self.preferredContentSize = CGSize(width: maxSize.width, height: 359)
        }
        
    }
}
