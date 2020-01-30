//
//  SettingsController.swift
//  meteocool
//
//  Created by Nina Loser on 30.01.20.
//  Copyright © 2020 Florian Mauracher. All rights reserved.
//
import UIKit

class SettingsViewController: UIViewController, UITableViewDataSource{
    @IBOutlet weak var settingsBar:UINavigationBar!
    @IBOutlet weak var settingsTable:UIScrollView!
    
    private var data: [String] = []
    
    //General View Things
    override func loadView() {
        super.loadView()
        self.view.addSubview(settingsBar)
        self.view.addSubview(settingsTable)
        
        for i in 0...1000 {
             data.append("\(i)")
        }
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
    }
    
    //Return Back with Done
    @IBAction func doneSettings(_ sender: Any){
        self.dismiss(animated: true,completion:nil)
    }
    
    //Setting Table Settings
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return 1
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "SwitcherCell")! //1.
              
           let text = data[indexPath.row] //2.
              
           cell.textLabel?.text = text //3.
              
           return cell //4.
    }
    
    func numberOfSections(in tableView: UITableView) -> Int {
        return 1
    }
}
