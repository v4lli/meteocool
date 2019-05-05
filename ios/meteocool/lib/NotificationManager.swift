import UIKit
import UserNotifications

let SharedNotificationManager = NotificationManager.init()

class NotificationManager: NSObject, UNUserNotificationCenterDelegate {
    private var pushToken: String?

    override init() {
        super.init()
        if (UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "pushEnabled") != nil) {
            // re-deliver push token to appDelegate
            self.registerForPushNotifications({_,_ in return})
        }
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
            completion(true, nil)
            UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(true, forKey: "pushEnabled")

            DispatchQueue.main.async {
                UIApplication.shared.registerForRemoteNotifications()
            }
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

    // caching implementation of getter/setter for the APNS push token. Apple says not to
    // cache the token, but for some reason the AppDelegate sometimes doesn't get the token
    // delivered upon re-registering...
    func setToken(token: String) {
        self.pushToken = token
        UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.setValue(token, forKey: "pushToken")
    }

    func getToken() -> String? {
        if self.pushToken == nil {
            self.pushToken = UserDefaults.init(suiteName: "group.org.frcy.app.meteocool")?.value(forKey: "pushToken") as? String
        }
        return self.pushToken
    }
}
