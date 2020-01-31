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
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    //Return Back with Done
    @IBAction func doneSettings(_ sender: Any){
        self.dismiss(animated: true,completion:nil)
    }
    
    //Setting Table Settings
    private var pushNotification = false
    private var mapRotation = false
    private var autoZoom = false
    private var lightnings = false
    private var shelters = false
    private var withDBZ = false
    private var mesocyclone = false
    
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
            if pushNotification {
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
        switchView.setOn(false, animated: true)
        
        
        returnCell = textCell
        switch indexPath.section{
        case 0: //Push Notification
            switch indexPath.row {
            case 0:
                switcherCell.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(pushNotification, animated: true)
            default:
                textCell.textLabel?.text = dataPushNotification[indexPath.row]
                returnCell = textCell
            }
        case 1: //Map View
            switch indexPath.row {
            case 0: //Map Rotation
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(mapRotation, animated: true)
            case 1: //Auto Zoom
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(autoZoom, animated: true)
            case 2: //Lightnings
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(lightnings, animated: true)
            case 3: //Shelters
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(shelters, animated: true)
            default:
                returnCell = textCell
            }
        case 2: //Pro Mode
            switch indexPath.row {
            case 0: //with dbZ
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(withDBZ, animated: true)
            case 1: //Mesocyclone
                switcherCell.textLabel?.text = dataMapView[indexPath.row]
                returnCell = switcherCell
                switchView.setOn(mesocyclone, animated: true)
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
            pushNotification = sender.isOn
            loadView()
//            settingsTable.numberOfRows(inSection: tableView(settingsTable, numberOfRowsInSection: 0))
//            for index in 1...dataPushNotification.count-1 {
//                settingsTable.reloadRows(at: [IndexPath(row: index, section: 0)], with: UITableView.RowAnimation.none)
//                    //= tableView(settingsTable, cellForRowAt: NSIndexPath(row: index, section: 0) as IndexPath)
//            }
        case 10:
            mapRotation = sender.isOn
        case 11:
            autoZoom = sender.isOn
        case 12:
            lightnings = sender.isOn
        case 13:
            shelters = sender.isOn
        case 20:
            withDBZ = sender.isOn
        case 21:
            mesocyclone = sender.isOn
        default:
            print("This not happen")
        }
    }
}
