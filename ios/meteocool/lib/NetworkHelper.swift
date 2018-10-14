import UIKit

class NetworkHelper {
    static let apiURL = URL(string: "https://meteocool.unimplemented.org/")!
    static let debug: Bool = true

    static func createRequest(dst: String, method: String) -> URLRequest? {
        var request = URLRequest(url: URL(string: dst, relativeTo: apiURL)!)
        request.httpMethod = method
        return request
    }

    static func createJSONPostRequest(dst: String, dictionary: [String: Any]) -> URLRequest? {
        let json = try! JSONSerialization.data(withJSONObject: dictionary)
        if let jsonString = String(data: json, encoding: .utf8), debug {
            print("POST: /\(String(describing: dst)) <- \(jsonString)")
        }

        var request = createRequest(dst: dst, method: "POST")
        request?.httpBody = json
        request?.setValue("application/json", forHTTPHeaderField: "Content-Type")

        return request
    }

    static func checkResponse(data: Data?, response: URLResponse?, error: Error?) -> Data? {
        guard let data = data, error == nil else {
            print("ERROR: \(String(describing: error))")
            return nil
        }

        let dst = response?.url?.path ?? ""
        if let httpStatus = response as? HTTPURLResponse, httpStatus.statusCode != 200 {
            print("RESP: \(String(describing: dst)) -> \(httpStatus.statusCode)")
            return nil
        }
        if let responseString = String(data: data, encoding: .utf8) {
            if (debug) {
                print("RESP: \(String(describing: dst)) -> \(responseString)")
            }
        }
        return data
    }
}
