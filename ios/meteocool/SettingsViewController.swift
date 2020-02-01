//
//  SettingsController.swift
//  meteocool
//
//  Created by Nina Loser on 30.01.20.
//  Copyright © 2020 Florian Mauracher. All rights reserved.
//
import UIKit

class SettingsViewController: UIViewController, UITableViewDelegate, UITableViewDataSource{
    @IBOutlet weak var settingsBar:UINavigationBar!
    @IBOutlet weak var settingsTable:UITableView!
    
    //General View Things
    override func loadView() {
        super.loadView()
        self.view.addSubview(settingsBar)
        self.view.addSubview(settingsTable)
        //viewController?.webView.evaluateJavaScript("window.injectSettings({\"mapRotation\": false});")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    //Return Back with Done
    @IBAction func doneSettings(_ sender: Any){
        self.dismiss(animated: true,completion:nil)
    }
    
    //userDefaults
    let userDefaults = UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")
    
    private var header = ["Push Notification","Map View","Pro Mode","About"]
    private var dataPushNotification = ["Push Notification", "Deactivate for ...", "Intensity","Time before"]
    private var dataMapView = ["Map Rotation","Auto Zoom","Lightnings","Shelters"]
    private var dataProMode = ["Push Notification with dbZ","Mesocyclone"]
    private var dataAbout = ["Link","Push Token","Version Nr"]

    //Nuber of Selections
    func numberOfSections(in tableView: UITableView) -> Int {
        return header.count
    }

    // Number of Rows
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch section{
        case 0:
            let pushNotification = userDefaults?.bool(forKey: "pushNotification")
            if pushNotification!{
                return dataPushNotification.count
            }
            else {
                return 1
            }
        case 1:
            return dataMapView.count
        case 2:
            return dataProMode.count
        case 3:
            return dataAbout.count
        default:
            return 0
        }
    }

    //Sections Header
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        return header[section]
    }

    //Table Content
    func tableView(_ tableView: UITableView,cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        var returnCell : UITableViewCell
        
        // kind of cells
        let switcherCell = tableView.dequeueReusableCell(withIdentifier:"switcherCell", for: indexPath)
        let textCell = tableView.dequeueReusableCell(withIdentifier:"textCell", for: indexPath)
        
        //here is programatically switch make to the table view
        let switchView = UISwitch(frame: .zero)
        switchView.onTintColor = UIColor(red: 0, green: 122/255, blue: 1, alpha: 1.0)
        
        
        returnCell = textCell
        switch indexPath.section{
        case 0: //Push Notification
            switch indexPath.row {
            case 0:
                switcherCell.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "pushNotification"))!, animated: false)
            default:
                textCell.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = textCell
            }
        case 1: //Map View
            switch indexPath.row {
            case 0: //Map Rotation
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "mapRotation"))!, animated: false)
            case 1: //Auto Zoom
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "autoZoom"))!, animated: false)
            case 2: //Lightnings
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "lightnings"))!, animated: false)
            case 3: //Shelters
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "shelters"))!, animated: false)
            default:
                returnCell = textCell
            }
        case 2: //Pro Mode
            switch indexPath.row {
            case 0: //with dbZ
                switcherCell.textLabel?.text = dataProMode[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "withDBZ"))!, animated: false)
            case 1: //Mesocyclone
                switcherCell.textLabel?.text = dataProMode[indexPath.row]
                returnCell = switcherCell
                switchView.setOn((userDefaults?.bool(forKey: "mesocyclone"))!, animated: false)
            default:
                returnCell = textCell
            }
        case 3: //About
            textCell.textLabel?.text = dataAbout[indexPath.row]
            returnCell = textCell
        default:
            returnCell = textCell
        }
        
        //SwitchChange
        //To detect which switch changed: Fist Num: Selection, Secend Num: Row
        switchView.tag = Int(String(indexPath.section)+String(indexPath.row))!
        switchView.addTarget(self, action: #selector(switchChanged(_:)), for: .valueChanged) //Change here!!!
        switcherCell.accessoryView = switchView
        
        return returnCell
    }
    
    @objc func switchChanged(_ sender : UISwitch!){
        switch sender.tag {
        case 0:
            userDefaults?.setValue(sender.isOn, forKey: "pushNotification")
            loadView()
        case 10:
            userDefaults?.setValue(sender.isOn, forKey: "mapRotation")
        case 11:
            userDefaults?.setValue(sender.isOn, forKey: "autoZoom")
        case 12:
            userDefaults?.setValue(sender.isOn, forKey: "lightnings")
        case 13:
            userDefaults?.setValue(sender.isOn, forKey: "shelters")
        case 20:
            userDefaults?.setValue(sender.isOn, forKey: "withDBZ")
        case 21:
            userDefaults?.setValue(sender.isOn, forKey: "mesocyclone")
        default:
            print("This not happen")
        }
    }
}
