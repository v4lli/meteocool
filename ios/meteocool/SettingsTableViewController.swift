//
//  SettingsTableViewController.swift
//  meteocool
//
//  Created by Nina Loser on 16.08.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import UIKit

class SettingsTableViewController: UITableViewController, UIPickerViewDelegate, UIPickerViewDataSource{
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

        timescaleData = ["5","10","15","20"]
        intensityData = ["Hardly noticeable","Light mist","Mist","Very light rain","Light rain","Light to moderate rain","Moderate rain","Moderate to heavy rain","Heavy rain","Very heavy Rain","Extreme rain"]

        timescaleValue = timescaleData[2]
        intensityValue = intensityData[3]
        
        didChange()
        togglePicker(indexPath: IndexPath.init(row: 1, section: 2))
        togglePicker(indexPath: IndexPath.init(row: 1, section: 0))
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
            didChange()
            return timescaleData[row]
        }
        if (pickerView == intensityPicker){
            intensityValue = intensityData[row]
            didChange()
            return intensityData[row]
        }
        return ""
    }
    
    override func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        let s = super.tableView(tableView, heightForRowAt: indexPath)
        if (timescalePickerHidden && indexPath.section == 1 && indexPath.row == 3) {
            return 0
        } else if(intensityPickerHidden && indexPath.section == 1 && indexPath.row == 1){
            return 0
        } else {
            return s
        }
    }
    
    override func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        switch (indexPath.section, indexPath.row) {
        case (1, 2):
            togglePicker(indexPath: indexPath)
        case (1, 0):
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
        case (1, 0):
            intensityPickerHidden = !intensityPickerHidden
            tableView.beginUpdates()
            tableView.endUpdates()
        case (1, 2):
            timescalePickerHidden = !timescalePickerHidden
            tableView.beginUpdates()
            tableView.endUpdates()
        default:
            ()
        }
    }
    
}
