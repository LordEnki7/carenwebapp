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
        return self.bridge?.viewController?.view.window ?? UIWindow()
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
