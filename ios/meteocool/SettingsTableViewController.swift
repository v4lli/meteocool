//
//  SettingsTableViewController.swift
//  meteocool
//
//  Created by Nina Loser on 16.08.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import UIKit

class SettingsTableViewController: UITableViewController, UIPickerViewDelegate, UIPickerViewDataSource{
    //Map Settings
    @IBOutlet weak var lightning: UISwitch!
    @IBOutlet weak var mesocyclone: UISwitch!
    @IBOutlet weak var rotation: UISwitch!

    //Warning Settings
    @IBOutlet weak var pushNotification: UISwitch!
    @IBOutlet weak var details: UISwitch!
    @IBOutlet weak var timescalePicker: UIPickerView!
    @IBOutlet weak var intensityPicker: UIPickerView!
    @IBOutlet weak var timescaleLabel: UILabel!
    @IBOutlet weak var intensityLabel: UILabel!

    var timescaleData: [String] = [String]()
    var timescaleValue: String = "..."
    var timescalePickerHidden = true

    var intensityData: [String] = [String]()
    var intensityValue: String = "..."
    var intensityPickerHidden = true

    override func viewDidLoad() {
        super.viewDidLoad()

        self.timescalePicker.delegate = self
        self.intensityPicker.delegate = self
        self.timescalePicker.dataSource = self
        self.intensityPicker.dataSource = self

        timescaleData = ["5 min","10 min","15 min","20 min"]
        intensityData = ["Hardly noticeable","Light rain","Moderate rain","Heavy rain","Extreme rain"]

        timescaleValue = timescaleData[2]
        intensityValue = intensityData[3]
    
        timescaleLabel.text = timescaleValue
        intensityLabel.text = intensityValue
        
        togglePicker(indexPath: IndexPath.init(row: 1, section: 4))
        togglePicker(indexPath: IndexPath.init(row: 1, section: 2))
    }
    
    func numberOfComponents(in pickerView: UIPickerView) -> Int {
        return 1
    }
    
    func pickerView(_ pickerView: UIPickerView, numberOfRowsInComponent component: Int) -> Int {
        if (pickerView == timescalePicker){
            return timescaleData.count
        }
        if (pickerView == intensityPicker){
            return intensityData.count
        }
        return 0
    }
    
    func pickerView(_ pickerView: UIPickerView, titleForRow row: Int, forComponent component: Int) -> String?{
        if (pickerView == timescalePicker){
            timescaleValue = timescaleData[row]
            timescaleLabel.text = timescaleValue
            return timescaleData[row]
        }
        if (pickerView == intensityPicker){
            intensityValue = intensityData[row]
            intensityLabel.text = intensityValue
            return intensityData[row]
        }
        return ""
    }
    
    override func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        let s = super.tableView(tableView, heightForRowAt: indexPath)
        if (timescalePickerHidden && indexPath.section == 1 && indexPath.row == 5) {
            return 0
        } else if(intensityPickerHidden && indexPath.section == 1 && indexPath.row == 3){
            return 0
        } else if(){
            
        } else {
            return s
        }
    }

    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        switch (indexPath.section, indexPath.row) {
        case (1, 4):
            togglePicker(indexPath: indexPath)
        case (1, 2):
            togglePicker(indexPath: indexPath)
        default:
            ()
        }
    }
    
    func didChange(){
        timescaleLabel.text = timescaleValue
        intensityLabel.text = intensityValue
    }
    
    func togglePicker(indexPath: IndexPath){
        switch (indexPath.section, indexPath.row) {
        case (1, 2):
            intensityPickerHidden = !intensityPickerHidden
            tableView.beginUpdates()
            tableView.endUpdates()
        case (1, 4):
            timescalePickerHidden = !timescalePickerHidden
            tableView.beginUpdates()
            tableView.endUpdates()
        default:
            ()
        }
    }
    
}
