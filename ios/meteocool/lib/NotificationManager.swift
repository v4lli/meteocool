import UIKit
import UserNotifications

class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    override init() {
        super.init()
        registerForPushNotifications()
    }

    func registerForPushNotifications() {
        let center = UNUserNotificationCenter.current()
        center.delegate = self
        center.requestAuthorization(options: [.alert, .sound, .badge]) {
            (granted, error) in
            NSLog("Permission granted: \(granted)")
            guard granted else { return }
            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
        }
        let openAction = UNNotificationAction(identifier: "OpenNotification", title: NSLocalizedString("Abrir", comment: ""), options: UNNotificationActionOptions.foreground)
        let deafultCategory = UNNotificationCategory(identifier: "CustomSamplePush", actions: [openAction], intentIdentifiers: [], options: [])
        center.setNotificationCategories(Set([deafultCategory]))
    }

    func clearNotifications() {
        UIApplication.shared.applicationIconBadgeNumber = 0
        UNUserNotificationCenter.current().removeAllDeliveredNotifications()
        UNUserNotificationCenter.current().removeAllPendingNotificationRequests()
    }
}
