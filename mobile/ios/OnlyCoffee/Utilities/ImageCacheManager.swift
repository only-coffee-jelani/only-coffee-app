import Foundation
import UIKit

/// Manages image caching for offline support
class ImageCacheManager {
    static let shared = ImageCacheManager()

    private let cache = NSCache<NSString, UIImage>()
    private let fileManager = FileManager.default
    private let cacheDirectory: URL

    private init() {
        // Set up cache directory
        let paths = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)
        cacheDirectory = paths[0].appendingPathComponent("ImageCache")

        // Create cache directory if it doesn't exist
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)

        // Configure memory cache
        cache.countLimit = 100
        cache.totalCostLimit = 100 * 1024 * 1024 // 100 MB

        // Configure URLCache for better offline support
        let memoryCapacity = 50 * 1024 * 1024 // 50 MB
        let diskCapacity = 100 * 1024 * 1024 // 100 MB
        let urlCache = URLCache(memoryCapacity: memoryCapacity, diskCapacity: diskCapacity, diskPath: "ImageURLCache")
        URLCache.shared = urlCache
    }

    /// Get image from cache or download
    func getImage(from url: URL, completion: @escaping (Result<UIImage, Error>) -> Void) {
        let cacheKey = url.absoluteString as NSString

        // Check memory cache first
        if let cachedImage = cache.object(forKey: cacheKey) {
            completion(.success(cachedImage))
            return
        }

        // Check disk cache
        let fileURL = diskCacheURL(for: url)
        if fileManager.fileExists(atPath: fileURL.path) {
            if let image = UIImage(contentsOfFile: fileURL.path) {
                cache.setObject(image, forKey: cacheKey)
                completion(.success(image))

                // Check for updates in background
                checkForUpdates(url: url, currentFileURL: fileURL)
                return
            }
        }

        // Download image
        downloadImage(from: url, completion: completion)
    }

    /// Download image and cache it
    private func downloadImage(from url: URL, completion: @escaping (Result<UIImage, Error>) -> Void) {
        var request = URLRequest(url: url)
        request.cachePolicy = .returnCacheDataElseLoad

        URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
            guard let self = self else { return }

            if let error = error {
                // Try to use cached version if download fails
                let fileURL = self.diskCacheURL(for: url)
                if self.fileManager.fileExists(atPath: fileURL.path),
                   let image = UIImage(contentsOfFile: fileURL.path) {
                    DispatchQueue.main.async {
                        completion(.success(image))
                    }
                } else {
                    DispatchQueue.main.async {
                        completion(.failure(error))
                    }
                }
                return
            }

            guard let data = data, let image = UIImage(data: data) else {
                DispatchQueue.main.async {
                    completion(.failure(NSError(domain: "ImageCacheManager", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid image data"])))
                }
                return
            }

            // Cache image
            let cacheKey = url.absoluteString as NSString
            self.cache.setObject(image, forKey: cacheKey)

            // Save to disk
            self.saveToDisk(image: image, for: url, response: response as? HTTPURLResponse)

            DispatchQueue.main.async {
                completion(.success(image))
            }
        }.resume()
    }

    /// Check for updates to cached image
    private func checkForUpdates(url: URL, currentFileURL: URL) {
        var request = URLRequest(url: url)
        request.cachePolicy = .reloadIgnoringLocalCacheData
        request.httpMethod = "HEAD"

        // Get current file modification date
        guard let attributes = try? fileManager.attributesOfItem(atPath: currentFileURL.path),
              let modificationDate = attributes[.modificationDate] as? Date else {
            return
        }

        // Set If-Modified-Since header
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
        dateFormatter.locale = Locale(identifier: "en_US_POSIX")
        dateFormatter.timeZone = TimeZone(abbreviation: "GMT")
        request.setValue(dateFormatter.string(from: modificationDate), forHTTPHeaderField: "If-Modified-Since")

        URLSession.shared.dataTask(with: request) { [weak self] _, response, _ in
            guard let self = self,
                  let httpResponse = response as? HTTPURLResponse else {
                return
            }

            // If server returns 200, image has been updated
            if httpResponse.statusCode == 200 {
                // Download new version
                self.downloadImage(from: url) { _ in }
            }
            // If 304 Not Modified, our cache is up to date
        }.resume()
    }

    /// Save image to disk cache
    private func saveToDisk(image: UIImage, for url: URL, response: HTTPURLResponse?) {
        let fileURL = diskCacheURL(for: url)

        guard let data = image.pngData() else { return }

        do {
            try data.write(to: fileURL)

            // Set file modification date from server's Last-Modified header if available
            if let lastModified = response?.allHeaderFields["Last-Modified"] as? String {
                let dateFormatter = DateFormatter()
                dateFormatter.dateFormat = "EEE, dd MMM yyyy HH:mm:ss zzz"
                dateFormatter.locale = Locale(identifier: "en_US_POSIX")
                dateFormatter.timeZone = TimeZone(abbreviation: "GMT")

                if let date = dateFormatter.date(from: lastModified) {
                    try fileManager.setAttributes([.modificationDate: date], ofItemAtPath: fileURL.path)
                }
            }
        } catch {
            print("Failed to save image to disk: \(error)")
        }
    }

    /// Get disk cache URL for a given URL
    private func diskCacheURL(for url: URL) -> URL {
        let filename = url.absoluteString.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? UUID().uuidString
        return cacheDirectory.appendingPathComponent(filename)
    }

    /// Clear all cached images
    func clearCache() {
        cache.removeAllObjects()
        try? fileManager.removeItem(at: cacheDirectory)
        try? fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
    }

    /// Get cache size in bytes
    func getCacheSize() -> Int64 {
        guard let files = try? fileManager.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: [.fileSizeKey]) else {
            return 0
        }

        return files.reduce(0) { total, fileURL in
            let fileSize = (try? fileManager.attributesOfItem(atPath: fileURL.path)[.size] as? Int64) ?? 0
            return total + fileSize
        }
    }
}
