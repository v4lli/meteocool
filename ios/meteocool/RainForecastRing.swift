//
//  RainForecastRing.swift
//  meteocool
//
//  Created by Nina Loser on 20.02.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import UIKit

class RainForecastRing: UIView {

    private struct Constants {
        static let arcWidth: CGFloat = 15
    }
    
    @IBInspectable var counter: Int = 5
    @IBInspectable var counterColor: UIColor = UIColor.init(white: 0, alpha: 100)
    
    override func draw(_ rect: CGRect) {
        self.backgroundColor = UIColor.init(white: 100, alpha: 0)
        // 1
        let center = CGPoint(x: 150, y: 150)
        
        // 2
        let diameter: CGFloat = max(bounds.width, bounds.height)-40
        
        // 3
        var startAngle: CGFloat
        var endAngle: CGFloat
        
        var color = [UIColor.red, UIColor.blue, UIColor.green, UIColor.gray, UIColor.purple, UIColor.brown, UIColor.red, UIColor.blue, UIColor.green]
        
        var path = UIBezierPath()
        
        for i in 2...(color.count+1){
            startAngle = CGFloat(3 * Double.pi / 2) - CGFloat(Double(i) * Double.pi / Double(color.count+4))
            endAngle = CGFloat(3 * Double.pi / 2) - CGFloat(Double(i+1) * Double.pi / Double(color.count+4))
            path = UIBezierPath(arcCenter: center,
                                 radius: diameter/2 - Constants.arcWidth/2,
                                 startAngle: startAngle,
                                 endAngle: endAngle,
                                 clockwise: false)
            path.lineWidth = Constants.arcWidth
            counterColor = color[i-2]
            counterColor.setStroke()
            path.stroke()
        }
    }

}
