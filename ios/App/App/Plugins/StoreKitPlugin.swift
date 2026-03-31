import Foundation
import Capacitor
import StoreKit

@available(iOS 15.0, *)
@objc(StoreKitPlugin)
public class StoreKitPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StoreKitPlugin"
    public let jsName = "StoreKit"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getProducts", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "purchaseProduct", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "restorePurchases", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCurrentTransactions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "finishTransaction", returnType: CAPPluginReturnPromise),
    ]

    @objc func getProducts(_ call: CAPPluginCall) {
        guard let productIds = call.getArray("productIds", String.self) else {
            call.reject("Missing productIds")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: Set(productIds))
                let result = products.map { product -> [String: Any] in
                    return [
                        "productId": product.id,
                        "title": product.displayName,
                        "description": product.description,
                        "price": product.displayPrice,
                        "priceAmount": NSDecimalNumber(decimal: product.price).doubleValue,
                        "currency": product.priceFormatStyle.currencyCode ?? "USD",
                    ]
                }
                call.resolve(["products": result])
            } catch {
                call.reject("Failed to fetch products: \(error.localizedDescription)")
            }
        }
    }

    @objc func purchaseProduct(_ call: CAPPluginCall) {
        guard let productId = call.getString("productId") else {
            call.reject("Missing productId")
            return
        }

        Task {
            do {
                let products = try await Product.products(for: [productId])
                guard let product = products.first else {
                    call.reject("Product not found")
                    return
                }

                let result = try await product.purchase()

                switch result {
                case .success(let verification):
                    switch verification {
                    case .verified(let transaction):
                        let txData: [String: Any] = [
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID,
                            "originalTransactionId": String(transaction.originalID),
                            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                            "expiresDate": transaction.expirationDate.map { ISO8601DateFormatter().string(from: $0) } ?? "",
                            "jwsRepresentation": verification.jwsRepresentation,
                        ]
                        call.resolve(["transaction": txData])
                    case .unverified(_, let error):
                        call.reject("Transaction verification failed: \(error.localizedDescription)")
                    }
                case .userCancelled:
                    call.reject("USER_CANCELLED")
                case .pending:
                    call.reject("Purchase is pending approval")
                @unknown default:
                    call.reject("Unknown purchase result")
                }
            } catch {
                call.reject("Purchase failed: \(error.localizedDescription)")
            }
        }
    }

    @objc func restorePurchases(_ call: CAPPluginCall) {
        Task {
            var transactions: [[String: Any]] = []

            for await result in Transaction.currentEntitlements {
                switch result {
                case .verified(let transaction):
                    let txData: [String: Any] = [
                        "transactionId": String(transaction.id),
                        "productId": transaction.productID,
                        "originalTransactionId": String(transaction.originalID),
                        "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                        "expiresDate": transaction.expirationDate.map { ISO8601DateFormatter().string(from: $0) } ?? "",
                        "jwsRepresentation": result.jwsRepresentation,
                    ]
                    transactions.append(txData)
                case .unverified(_, _):
                    continue
                }
            }

            call.resolve(["transactions": transactions])
        }
    }

    @objc func getCurrentTransactions(_ call: CAPPluginCall) {
        Task {
            var transactions: [[String: Any]] = []

            for await result in Transaction.currentEntitlements {
                switch result {
                case .verified(let transaction):
                    let isActive: Bool
                    if let expirationDate = transaction.expirationDate {
                        isActive = expirationDate > Date()
                    } else {
                        isActive = transaction.revocationDate == nil
                    }

                    if isActive {
                        let txData: [String: Any] = [
                            "transactionId": String(transaction.id),
                            "productId": transaction.productID,
                            "originalTransactionId": String(transaction.originalID),
                            "purchaseDate": ISO8601DateFormatter().string(from: transaction.purchaseDate),
                            "expiresDate": transaction.expirationDate.map { ISO8601DateFormatter().string(from: $0) } ?? "",
                        ]
                        transactions.append(txData)
                    }
                case .unverified(_, _):
                    continue
                }
            }

            call.resolve(["transactions": transactions])
        }
    }

    @objc func finishTransaction(_ call: CAPPluginCall) {
        guard let transactionIdStr = call.getString("transactionId"),
              let transactionId = UInt64(transactionIdStr) else {
            call.reject("Missing or invalid transactionId")
            return
        }

        Task {
            for await result in Transaction.currentEntitlements {
                if case .verified(let transaction) = result, transaction.id == transactionId {
                    await transaction.finish()
                    call.resolve()
                    return
                }
            }
            call.resolve()
        }
    }
}
