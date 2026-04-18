import UIKit
import Capacitor
import RevenueCat
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        Purchases.configure(withAPIKey: "test_amFSEvhmEODIzuKIQISRzcBfDtm")

        #if DEBUG && targetEnvironment(simulator)
        // Simulator-only cache hardening.
        // Forces every Xcode/simulator launch to start with a clean WebView so
        // stale HTML/JS from earlier builds can never linger and mask new code.
        // This block is compiled out of TestFlight, App Store, and real-device
        // builds — production behavior is completely unchanged.
        URLCache.shared.removeAllCachedResponses()
        HTTPCookieStorage.shared.removeCookies(since: Date.distantPast)
        WKWebsiteDataStore.default().removeData(
            ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
            modifiedSince: Date.distantPast
        ) {
            NSLog("[CAREN] Simulator WebView cache cleared on launch")
        }
        #endif

        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
