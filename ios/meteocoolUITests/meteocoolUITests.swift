import XCTest

class meteocoolUITests: XCTestCase {
    let app = XCUIApplication()

    override func setUp() {
        continueAfterFailure = false
        SpringboardHelper.deleteMyApp()

        setupSnapshot(app)
        app.launch()

        addUIInterruptionMonitor(withDescription: "Alert") {
            (alert) -> Bool in
            let okButton = alert.buttons["OK"]
            if okButton.exists {
                okButton.tap()
            }
            let allowButton = alert.buttons["Allow"]
            if allowButton.exists {
                allowButton.tap()
            }
            let alwaysAllowButton = alert.buttons["Always Allow"]
            if alwaysAllowButton.exists {
                alwaysAllowButton.tap()
            }
            return true
        }
    }

    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
    }

    func testOnboarding() {
        // Wait for map to load
        sleep(5)

        snapshot("1-Onboarding-1")
        let nextButton = app.buttons["Next"]
        nextButton.tap()

        snapshot("1-Onboarding-2")
        nextButton.tap()

        snapshot("1-Onboarding-3")
        let notificationButton = app.buttons["Enable Notifications"]
        let notificationButtonExists = notificationButton.waitForExistence(timeout: 10)
        XCTAssert(notificationButtonExists)
        notificationButton.tap()
        app.tap()

        snapshot("1-Onboarding-4")
        let locationButton = app.buttons["Enable Location Services"]
        let locationButtonExists = locationButton.waitForExistence(timeout: 10)
        XCTAssert(locationButtonExists)
        locationButton.tap()
        app.tap()

        snapshot("1-Onboarding-5")
        app.buttons["Done"].tap()

        snapshot("0-Launch1")
    }
}
