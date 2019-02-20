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
    
    let ringAngle = 99

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

        let angle = atan((corner_right.y-150-newPoint.y)/(corner_right.x+75-newPoint.x))

        var slot = 0

        if(newPoint.x > corner_right.x-75 && newPoint.y > corner_right.y-300) {
            viewCont?.move_slider_button(pointToMove: CGPoint.init(x: (corner_right.x+75)-140*cos(angle), y: (corner_right.y-150)-140*sin(angle)))
            
            print(Float(angle*180/3.1415))

            switch(true) {
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*0):
                    slot = 0
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate)
                    print("Winkel: 0 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*1):
                    slot = 1
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(5.0*60))
                    print("Winkel: 5 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*2):
                    slot = 2
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(10.0*60))
                    print("Winkel: 10 min")
                break
            case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*3):
                    slot = 3
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(15.0*60))
                    print("Winkel: 15 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*4):
                    slot = 4
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(20.0*60))
                    print("Winkel: 20 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*5):
                    slot = 5
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(25.0*60))
                    print("Winkel: 25 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*6):
                    slot = 6
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(30.0*60))
                    print("Winkel: 30 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*7):
                    slot = 7
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(35.0*60))
                    print("Winkel: 35 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*8):
                    slot = 8
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(40.0*60))
                    print("Winkel: 40 min")
                break
                case Float(angle*180/3.1415) >= Float(ringAngle/2-(ringAngle/9)*9):
                    slot = 8
                    viewCont?.time.text = viewCont?.formatter.string(from: viewCont!.currentdate.addingTimeInterval(40.0*60))
                    print("Winkel: 45 min")
                break
                default:
                    //print("default")
                    return
            }
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
