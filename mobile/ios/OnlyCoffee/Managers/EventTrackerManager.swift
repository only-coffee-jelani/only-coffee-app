import Foundation
import UIKit
import CoreLocation

/// Manager for automatic event tracking and session management
class EventTrackerManager: NSObject, ObservableObject {
    static let shared = EventTrackerManager()

    // MARK: - Properties

    @Published var currentSessionId: String
    @Published var isTrackingEnabled: Bool = true

    private let userDefaults = UserDefaults.standard
    private let sessionIdKey = "EventTrackerSessionId"
    private let lastAppVersionKey = "EventTrackerLastAppVersion"

    private var appLaunchTime: Date?
    private var sessionStartTime: Date?

    // Event batching
    private var eventQueue: [TrackEventRequest] = []
    private let batchSize = 10 // Send events in batches of 10
    private let batchInterval: TimeInterval = 30 // Or every 30 seconds

    private var batchTimer: Timer?

    // MARK: - Initialization

    override private init() {
        // Generate or restore session ID
        if let existingSessionId = userDefaults.string(forKey: sessionIdKey) {
            self.currentSessionId = existingSessionId
        } else {
            self.currentSessionId = UUID().uuidString
            userDefaults.set(self.currentSessionId, forKey: sessionIdKey)
        }

        super.init()

        setupObservers()
        startBatchTimer()
    }

    // MARK: - Setup

    private func setupObservers() {
        // App lifecycle observers
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillResignActive),
            name: UIApplication.willResignActiveNotification,
            object: nil
        )

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(appWillTerminate),
            name: UIApplication.willTerminateNotification,
            object: nil
        )
    }

    // MARK: - Session Management

    /// Start a new session
    func startNewSession() {
        currentSessionId = UUID().uuidString
        userDefaults.set(currentSessionId, forKey: sessionIdKey)
        sessionStartTime = Date()
        print("📊 New event tracking session started: \(currentSessionId)")
    }

    /// Get current session duration in seconds
    func getSessionDuration() -> TimeInterval? {
        guard let startTime = sessionStartTime else { return nil }
        return Date().timeIntervalSince(startTime)
    }

    // MARK: - App Lifecycle Events

    @objc private func appDidBecomeActive() {
        guard isTrackingEnabled else { return }

        // Check if this is a new app version
        let currentVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String
        let lastVersion = userDefaults.string(forKey: lastAppVersionKey)

        if currentVersion != lastVersion {
            // App updated - start new session
            startNewSession()
            userDefaults.set(currentVersion, forKey: lastAppVersionKey)
        } else if appLaunchTime == nil {
            // Fresh app launch
            startNewSession()
        }

        appLaunchTime = Date()
        sessionStartTime = Date()

        // Track app opened event
        Task {
            await EventTrackerService.shared.trackAppOpened()
        }
    }

    @objc private func appWillResignActive() {
        guard isTrackingEnabled else { return }

        // Flush any pending events
        Task {
            await flushEventQueue()
        }

        // Track app closed event
        Task {
            await EventTrackerService.shared.trackAppClosed()
        }
    }

    @objc private func appWillTerminate() {
        guard isTrackingEnabled else { return }

        // Flush any pending events synchronously
        // Note: In production, consider using background tasks for this
        Task {
            await flushEventQueue()
            await EventTrackerService.shared.trackAppClosed()
        }
    }

    // MARK: - Event Batching

    private func startBatchTimer() {
        batchTimer = Timer.scheduledTimer(
            withTimeInterval: batchInterval,
            repeats: true
        ) { [weak self] _ in
            Task {
                await self?.flushEventQueue()
            }
        }
    }

    /// Add event to queue for batch processing
    func queueEvent(_ event: TrackEventRequest) {
        eventQueue.append(event)

        // Flush if batch size reached
        if eventQueue.count >= batchSize {
            Task {
                await flushEventQueue()
            }
        }
    }

    /// Flush all queued events
    private func flushEventQueue() async {
        guard !eventQueue.isEmpty else { return }

        let eventsToSend = eventQueue
        eventQueue.removeAll()

        do {
            let response = try await EventTrackerService.shared.trackEventsBatch(eventsToSend)
            print("✅ Flushed \(response.count) events from queue")
        } catch {
            // Put events back in queue on failure
            eventQueue.append(contentsOf: eventsToSend)
            print("❌ Failed to flush event queue: \(error.localizedDescription)")
        }
    }

    // MARK: - Tracking Control

    /// Enable event tracking
    func enableTracking() {
        isTrackingEnabled = true
        print("📊 Event tracking enabled")
    }

    /// Disable event tracking (for user privacy controls)
    func disableTracking() {
        isTrackingEnabled = false
        eventQueue.removeAll()
        print("📊 Event tracking disabled")
    }

    // MARK: - Cleanup

    deinit {
        batchTimer?.invalidate()
        NotificationCenter.default.removeObserver(self)
    }
}
