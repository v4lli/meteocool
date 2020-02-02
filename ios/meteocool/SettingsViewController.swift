//
//  SettingsController.swift
//  meteocool
//
//  Created by Nina Loser on 30.01.20.
//  Copyright © 2020 Florian Mauracher. All rights reserved.
//
import UIKit
import StepSlider

class SettingsViewController: UIViewController, UITableViewDelegate, UITableViewDataSource{
    @IBOutlet weak var settingsBar:UINavigationBar!
    @IBOutlet weak var settingsTable:UITableView!
    
    //General View Things
    override func loadView() {
        super.loadView()
        self.view.addSubview(settingsBar)
        self.view.addSubview(settingsTable)
        
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        settingsTable.estimatedRowHeight = 100
        settingsTable.rowHeight = 44
    }
    
    //Return Back with Done
    @IBAction func doneSettings(_ sender: Any){
        self.dismiss(animated: true,completion:nil)
    }
    
    //userDefaults
    let userDefaults = UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")
    
    private var header = ["Push Notification","Map View","Layers","About"]
    private var dataPushNotification = ["Push Notification", "Deactivate for ...","Push Notification with dbZ" , "Intensity \n test","Time before"]
    private var dataMapView = ["Map Rotation","Auto Zoom","Darkmode"]
    private var dataLayers = ["Lightning ⚡️","Mesocyclones 🌀","Shelters ☂️"]
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
            return dataLayers.count
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
        let switcherCell = tableView.dequeueReusableCell(withIdentifier:"switcherCell")
        let textCell = tableView.dequeueReusableCell(withIdentifier:"textCell")
        let stepperSliderCell = tableView.dequeueReusableCell(withIdentifier: "stepperSliderCell")
        
        //here is programatically switch make to the table view
        let switchView = UISwitch(frame: .zero)
        switchView.onTintColor = UIColor(red: 0, green: 122/255, blue: 1, alpha: 1.0)
        
        let intensityStepperSliderView = StepSlider.init(frame: CGRect(x: 5.0,y: 70.0,width: tableView.frame.width-10,height: 44.0))
        intensityStepperSliderView.maxCount = 4
        
        returnCell = textCell!
        switch indexPath.section{
        case 0: //Push Notification
            switch indexPath.row {
            case 0: //Notificatino On/Off
                switcherCell?.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "pushNotification"))!, animated: false)
            case 2: //with dbZ
                switcherCell?.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "withDBZ"))!, animated: false)
            case 3: //Intensity
                stepperSliderCell!.addSubview(intensityStepperSliderView)
                stepperSliderCell?.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = stepperSliderCell!
            default:
                textCell?.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = textCell!
            }
        case 1: //Map View
            switch indexPath.row {
            case 0: //Map Rotation
                switcherCell?.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "mapRotation"))!, animated: false)
            case 1: //Auto Zoom
                switcherCell?.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "autoZoom"))!, animated: false)
            case 2: //DarkMode
                switcherCell?.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "darkMode"))!, animated: false)
            default:
                returnCell = textCell!
            }
        case 2: //Layers
            switch indexPath.row{
            case 0: //Lightning
                switcherCell?.textLabel?.text = dataLayers[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "lightning"))!, animated: false)
            case 1: //Mesocyclones
                switcherCell?.textLabel?.text = dataLayers[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "mesocyclones"))!, animated: false)
            case 2: //Shelters
                switcherCell?.textLabel?.text = dataLayers[indexPath.row]
                returnCell = switcherCell!
                switchView.setOn((userDefaults?.bool(forKey: "shelters"))!, animated: false)
            default:
                returnCell = textCell!
            }
        case 3: //About
            textCell?.textLabel?.text = dataAbout[indexPath.row]
            returnCell = textCell!
        default:
            returnCell = textCell!
        }
        
        //SwitchChange
        //To detect which switch changed: Fist Num: Selection, Secend Num: Row
        switchView.tag = Int(String(indexPath.section)+String(indexPath.row))!
        switchView.addTarget(self, action: #selector(switchChanged(_:)), for: .valueChanged) //Change here!!!
        switcherCell!.accessoryView = switchView
        
        return returnCell
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        if(indexPath.section == 0 && (indexPath.row == 3 || indexPath.row == 4)){
            return 100
        }
        return tableView.rowHeight
    }
    
    @objc func switchChanged(_ sender : UISwitch!){
        switch sender.tag {
        //Push Notification
        case 0:
            userDefaults?.setValue(sender.isOn, forKey: "pushNotification")
            loadView()
        case 2:
            userDefaults?.setValue(sender.isOn, forKey: "withDBZ")
        //Map View
        case 10:
            userDefaults?.setValue(sender.isOn, forKey: "mapRotation")
            viewController?.webView.evaluateJavaScript("window.injectSettings({\"mapRotation\": \(sender.isOn)});")
        case 11:
            userDefaults?.setValue(sender.isOn, forKey: "autoZoom")
            viewController?.webView.evaluateJavaScript("window.injectSettings({\"zoomOnForeground\": \(sender.isOn)});")
        case 12:
            userDefaults?.setValue(sender.isOn, forKey: "darkMode")
            viewController?.webView.evaluateJavaScript("window.injectSettings({\"darkMode\": \(sender.isOn)});")
        //Layers
        case 20:
            userDefaults?.setValue(sender.isOn, forKey: "lightning")
            viewController?.webView.evaluateJavaScript("window.injectSettings({\"layerLightning\": \(sender.isOn)});")
        case 21:
            userDefaults?.setValue(sender.isOn, forKey: "mesocyclones")
            viewController?.webView.evaluateJavaScript("window.injectSettings({\"layerMesocyclones\": \(sender.isOn)});")
        case 22:
            userDefaults?.setValue(sender.isOn, forKey: "shelters")
            //viewController?.webView.evaluateJavaScript("window.injectSettings({\"layerShelters\": \(sender.isOn)});")
        default:
            print("This not happen")
        }
    }
}
