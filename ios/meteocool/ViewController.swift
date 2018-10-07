//
//  ViewController.swift
//  meteocool
//
//  Created by Florian Mauracher on 25.08.18.
//  Copyright © 2018 Florian Mauracher. All rights reserved.
//

import UIKit
import WebKit

class ViewController: UIViewController, WKUIDelegate {
    @IBOutlet weak var webView: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()

        if let url = URL(string: "https://unimplemented.org/meteocool/") {
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
