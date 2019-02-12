import Foundation
import CoreMotion

let NUM_PRESSURE_MEASUREMENTS = 3

/**
 * Takes air pressure measurements
 */
class PressureManager {
    let available = CMAltimeter.isRelativeAltitudeAvailable()
    var lastPressure: Float = 0
    var lastTimestamp: Double = NSDate().timeIntervalSince1970

    var averagePressureMeasurement: Float = 0
    var samplesTaken: Int = 0
    var completion: ((Float) -> Void)?

    lazy var altimeter = CMAltimeter()

    /* currently unused */
    private func updateMeasurementAvg() {
        if (!available) {
            return
        }

        // we have a location fix, now read a few values from the altimeter
        self.averagePressureMeasurement = 0
        self.samplesTaken = 0
        self.altimeter.startRelativeAltitudeUpdates(to: OperationQueue.main, withHandler: { (altitudeData: CMAltitudeData?, _:Error?) in
            guard let altitudeData = altitudeData else {
                self.altimeter.stopRelativeAltitudeUpdates()
                NSLog("Error reading altimeter despite reported as available")
                return
            }
            // not sure if necessary to avoid processing old OperationQueue items.
            if (self.samplesTaken >= NUM_PRESSURE_MEASUREMENTS) {
                return
            }

            // average over the last n measurements
            // XXX time will tell if this is really necessary... the altimeter is very accurate, so it might not be necessary
            // to take an average. remove if battery usage is a concern.

            // convert to hPa
            let measurement = altitudeData.pressure.floatValue * 10
            if (self.samplesTaken == 0) {
                self.averagePressureMeasurement = measurement
            } else {
                self.averagePressureMeasurement = (self.averagePressureMeasurement + measurement) / 2
            }
            self.samplesTaken += 1

            if (self.samplesTaken >= NUM_PRESSURE_MEASUREMENTS) {
                //NSLog("Average pressure (%d measurements): %f", NUM_PRESSURE_MEASUREMENTS, averagePressureMeasurement)
                self.altimeter.stopRelativeAltitudeUpdates()

                self.lastTimestamp = NSDate().timeIntervalSince1970
                self.lastPressure = self.averagePressureMeasurement
                if self.completion != nil {
                    self.completion?(self.lastPressure)
                }
            }
        })
    }

    private func updateMeasurementOneshot() {
        if (!available) {
            return
        }

        // we have a location fix, now read a few values from the altimeter
        self.altimeter.startRelativeAltitudeUpdates(to: OperationQueue.main, withHandler: { (altitudeData: CMAltitudeData?, _:Error?) in
            guard let altitudeData = altitudeData else {
                self.altimeter.stopRelativeAltitudeUpdates()
                NSLog("Error reading altimeter despite reported as available")
                return
            }

            // convert to hPa
            let measurement = altitudeData.pressure.floatValue * 10
                self.altimeter.stopRelativeAltitudeUpdates()

                self.lastTimestamp = NSDate().timeIntervalSince1970
                self.lastPressure = measurement
                if self.completion != nil {
                    self.completion?(self.lastPressure)
                    self.completion = nil
                }
            }
        )
    }

    func getPressure(completion: @escaping (Float) -> Void) {
        if (!available) {
            completion(-1)
            return
        }
        self.completion = completion
        updateMeasurementOneshot()
    }
}
