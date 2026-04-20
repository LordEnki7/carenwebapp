import UIKit
import Capacitor
import WebKit

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // RevenueCat is initialized from JavaScript via @revenuecat/purchases-capacitor plugin.
        // Do NOT call Purchases.configure here — iapService.ts handles it through the Capacitor bridge.

        // Clear WebView cache on every launch so the app always loads fresh code from
        // carenalert.com. Since all web content is served from the server, caching the
        // HTML/JS in WKWebView only causes users to see stale code after a deploy.
        // Static assets (images, fonts) are still cached by the CDN/server headers.
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        let currentBuild = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? ""
        let versionKey = "lastLaunchedVersion"
        let storedVersion = UserDefaults.standard.string(forKey: versionKey) ?? ""
        let versionString = "\(currentVersion).\(currentBuild)"

        if storedVersion != versionString {
            // New build detected — wipe everything so fresh code loads immediately
            URLCache.shared.removeAllCachedResponses()
            HTTPCookieStorage.shared.removeCookies(since: Date.distantPast)
            WKWebsiteDataStore.default().removeData(
                ofTypes: WKWebsiteDataStore.allWebsiteDataTypes(),
                modifiedSince: Date.distantPast
            ) {
                NSLog("[CAREN] WebView cache cleared for new build: \(versionString)")
            }
            UserDefaults.standard.set(versionString, forKey: versionKey)
        }

        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
