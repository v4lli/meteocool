//
//  SettingsBundleHelper.swift
//  meteocool
//
//  Created by Nina Loser on 16.08.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import Foundation

class SettingsBundleHelper {
    struct SettingsBundleKeys {
        static let BuildVersionKey = "token_preference"
    }
    
    class func setToken() {
        let token: String = "bla" 
        UserDefaults.standard.set(token, forKey: "token_preference")
    }
}
