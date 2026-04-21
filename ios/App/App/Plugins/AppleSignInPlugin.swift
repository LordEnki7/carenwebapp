import Foundation
import AuthenticationServices
import Capacitor

@objc(AppleSignInPlugin)
public class AppleSignInPlugin: CAPPlugin, CAPBridgedPlugin, ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {

    public let identifier = "AppleSignInPlugin"
    public let jsName = "AppleSignIn"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "signIn", returnType: CAPPluginReturnPromise),
    ]

    private var signInCall: CAPPluginCall?

    @objc func signIn(_ call: CAPPluginCall) {
        self.signInCall = call

        let provider = ASAuthorizationAppleIDProvider()
        let request = provider.createRequest()
        request.requestedScopes = [.fullName, .email]

        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }

    public func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
        // Prefer the bridge's own window — works on iPhone and most iPad cases
        if let window = self.bridge?.viewController?.view.window {
            return window
        }
        // iPad fallback: find the foreground active scene's key window.
        // On iPadOS the bridge window can be nil if the scene isn't fully active yet.
        if let scene = UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .first(where: { $0.activationState == .foregroundActive }) {
            if let keyWindow = scene.windows.first(where: { $0.isKeyWindow }) {
                return keyWindow
            }
            if let anyWindow = scene.windows.first {
                return anyWindow
            }
        }
        return UIWindow()
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let call = signInCall else { return }

        if let credential = authorization.credential as? ASAuthorizationAppleIDCredential {
            var result = JSObject()

            if let tokenData = credential.identityToken,
               let token = String(data: tokenData, encoding: .utf8) {
                result["identityToken"] = token
            }

            if let codeData = credential.authorizationCode,
               let code = String(data: codeData, encoding: .utf8) {
                result["authorizationCode"] = code
            }

            result["user"] = credential.user
            result["email"] = credential.email ?? ""
            result["givenName"] = credential.fullName?.givenName ?? ""
            result["familyName"] = credential.fullName?.familyName ?? ""

            call.resolve(result)
        } else {
            call.reject("Apple Sign In credential not available")
        }

        self.signInCall = nil
    }

    public func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        guard let call = signInCall else { return }

        let nsError = error as NSError
        if nsError.code == ASAuthorizationError.canceled.rawValue {
            call.reject("cancelled")
        } else {
            call.reject(error.localizedDescription)
        }

        self.signInCall = nil
    }
}
