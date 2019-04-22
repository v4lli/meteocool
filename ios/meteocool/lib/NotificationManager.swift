import UIKit
import UserNotifications

let SharedNotificationManager = NotificationManager.init()

class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    override init() {
        super.init()
    }

    func registerForPushNotifications(_ completion: @escaping (_ success: Bool, _ error: Error?) -> Void) {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.requestAuthorization(options: [.alert, .sound, .badge]) {
            (granted, _) in
            NSLog("Permission granted: \(granted)")
            guard granted else {
                completion(false, nil)
                return
            }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
            completion(true, nil)
        }
        let openAction = UNNotificationAction(identifier: "OpenNotification", title: NSLocalizedString("Open", comment: ""), options: UNNotificationActionOptions.foreground)
        let deafultCategory = UNNotificationCategory(identifier: "WeatherAlert", actions: [openAction], intentIdentifiers: [], options: [])
        center.setNotificationCategories(Set([deafultCategory]))
    }

    func clearNotifications() {
        UIApplication.shared.applicationIconBadgeNumber = 0
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
