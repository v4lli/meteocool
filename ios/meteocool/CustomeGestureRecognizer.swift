//
//  CustomeGestureRecognizer.swift
//  meteocool
//
//  Created by Nina Loser on 05.02.19.
//  Copyright © 2019 Florian Mauracher. All rights reserved.
//

import UIKit
import UIKit.UIGestureRecognizer

enum SymbolPhase {
    case notStarted
    case initialPoint
}

class CustomGestureRecognizer: UIGestureRecognizer {
    var strokePhase: SymbolPhase = .notStarted
    var initialTouchPoint: CGPoint = CGPoint.zero
    var trackedTouch: UITouch?
    var viewCont: ViewController?

    let ringAngle = 99.0 //count of degree that are seeable
    let xValueRing = 75.0 //x-size of the ring (picture, half ring)
    let yValueRing = 300.0 // y-size of the ring (picture, half ring)
    let yRing = 176.0 //y-position of the ring (picture) from the top
    let slots = 9 //cout of slots of the forcarst
    let timeSteps = 5.0 //the steps of the forcarst in minuts

    var corner_right: CGPoint = CGPoint.init(x: UIScreen.main.bounds.width, y: UIScreen.main.bounds.height)

    var lastSlot = 0

    func setView(viewing: ViewController) {
        viewCont = viewing
    }

    override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesBegan(touches, with: event)
        //only one finger
        if touches.count != 1 {
            self.state = .failed
        }
        // Capture the first touch and store some information about it.
        if self.trackedTouch == nil {
            self.trackedTouch = touches.first
            self.strokePhase = .initialPoint
            self.initialTouchPoint = (self.trackedTouch?.location(in: self.view))!

        } else {
            // Ignore all but the first touch.
            for touch in touches {
                if touch != self.trackedTouch {
                    self.ignore(touch, for: event)
                }
            }
        }
    }

    override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesMoved(touches, with: event)
        let newTouch = touches.first
        // There should be only the first touch.
        guard newTouch == self.trackedTouch else {
            self.state = .failed
            return
        }
        let newPoint = (newTouch?.location(in: self.view))!

        let angle = atan((CGFloat(yRing)+CGFloat(yValueRing/2)-newPoint.y)/(corner_right.x+CGFloat(xValueRing)-newPoint.x))

        //multiply these to get form rad the degree
        let toDegree = 180/Float.pi

        var slot = 0

        //Touch moves in the picture of the ring
        if(newPoint.x > (corner_right.x - CGFloat(xValueRing)) && (newPoint.y > CGFloat(yRing)) && (newPoint.y) < CGFloat(yRing+yValueRing)) {
            //move the button to the right position on the ring
            viewCont?.move_slider_button(pointToMove: CGPoint.init(x: (corner_right.x+CGFloat(xValueRing))-140*cos(angle), y: CGFloat(yRing)+CGFloat(yValueRing/2)-140*sin(angle)))

            //set the time shown in the time lable
            switch(true) {
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*0):
                    slot = 0
                    //print("Winkel: 0 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*1):
                    slot = 1
                    //print("Winkel: 5 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*2):
                    slot = 2
                    //print("Winkel: 10 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*3):
                    slot = 3
                    //print("Winkel: 15 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*4):
                    slot = 4
                    //print("Winkel: 20 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*5):
                    slot = 5
                    //print("Winkel: 25 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*6):
                    slot = 6
                    //print("Winkel: 30 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*7):
                    slot = 7
                    //print("Winkel: 35 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*8):
                    slot = 8
                    //print("Winkel: 40 min")
                break
                case Float(angle)*toDegree >= Float(ringAngle/2-(ringAngle/Double(slots))*9):
                    slot = 8
                    //print("Winkel: 45 min")
                break
                default:
                    //print("default")
                    return
            }

            viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(Double(slot)*timeSteps*60))
        }

        if (slot != self.lastSlot) {
            viewCont?.webView.evaluateJavaScript("window.setForecastLayer(\(slot));")
            print("window.setForecastLayer(\(slot));")
            self.lastSlot = slot
        }
    }

    override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesEnded(touches, with: event)
        let newTouch = touches.first
        // There should be only the first touch.
        guard newTouch == self.trackedTouch else {
            self.state = .failed
            return
        }

        let newPoint = (newTouch?.location(in: self.view))!
        // If the stroke was down up and the final point is
        // below the initial point, the gesture succeeds.
        if self.state == .possible &&
            newPoint.y != initialTouchPoint.y {
            self.state = .recognized
        } else {
            self.state = .failed
        }
    }

    override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
        super.touchesCancelled(touches, with: event)
        self.state = .cancelled
        reset()
    }

    override func reset() {
        //reset the values for the next touch
        super.reset()
        self.initialTouchPoint = CGPoint.zero
        self.strokePhase = .notStarted
        self.trackedTouch = nil
    }
}
