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
    let webView = WKWebView()

    override func viewDidLoad() {
        super.viewDidLoad()

        if let url = URL(string: "https://unimplemented.org/meteocool/") {
            let request = URLRequest(url: url)
            webView.load(request)
        }
    }

    override func loadView() {
        self.view = webView
    }
}
