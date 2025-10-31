# iOS Event Tracker Integration Guide

## Overview
The Event Tracker SDK allows the Only Coffee iOS app to track user behavior and send events to the backend for AI personalization.

## Files Created

### Models
- `OnlyCoffee/Models/UserEvent.swift` - Event types, request/response models

### Services
- `OnlyCoffee/Services/EventTrackerService.swift` - API service for tracking events

### Managers
- `OnlyCoffee/Managers/EventTrackerManager.swift` - Automatic session and lifecycle tracking

## Quick Start

### 1. Initialize in App Launch

The `EventTrackerManager` is automatically initialized as a singleton. It will:
- Generate unique session IDs for each app session
- Automatically track `app_opened` and `app_closed` events
- Batch events for efficient network usage
- Handle app lifecycle events

### 2. Track Events in Your Views

```swift
import SwiftUI

struct MenuView: View {
    var body: some View {
        VStack {
            // Your menu UI
        }
        .onAppear {
            // Track menu viewed
            Task {
                await EventTrackerService.shared.trackMenuViewed()
            }
        }
    }
}
```

### 3. Track Specific Actions

```swift
// Track purchase completed
Task {
    await EventTrackerService.shared.trackPurchaseCompleted(
        orderId: order.id,
        totalAmount: order.totalAmount,
        items: order.items.map { [
            "id": $0.id,
            "name": $0.name,
            "quantity": $0.quantity,
            "price": $0.price
        ]}
    )
}

// Track item viewed
Task {
    await EventTrackerService.shared.trackItemViewed(
        itemId: menuItem.id,
        itemName: menuItem.name,
        category: menuItem.category,
        price: menuItem.price
    )
}

// Track promotion clicked
Task {
    await EventTrackerService.shared.trackPromotionClicked(
        promotionId: promotion.id,
        promotionType: promotion.type
    )
}

// Track search
Task {
    await EventTrackerService.shared.trackSearchPerformed(
        query: searchText,
        resultCount: searchResults.count
    )
}

// Track loyalty checked
Task {
    await EventTrackerService.shared.trackLoyaltyChecked()
}
```

## Available Event Types

### App Lifecycle
- `.appOpened` - Automatically tracked
- `.appClosed` - Automatically tracked

### Shopping
- `.purchaseCompleted` - Track after successful order
- `.cartAbandoned` - Track when user leaves checkout
- `.menuViewed` - Track when menu screen appears
- `.itemViewed` - Track when user views menu item details

### Search & Discovery
- `.searchPerformed` - Track when user searches
- `.filterApplied` - Track when user applies filters

### Promotions & Notifications
- `.promotionViewed` - Track when promotion is displayed
- `.promotionClicked` - Track when user taps promotion
- `.notificationOpened` - Track when push notification is opened
- `.notificationDismissed` - Track when notification is dismissed

### Location
- `.locationEntered` - Track when user enters geofence
- `.locationExited` - Track when user exits geofence
- `.geofenceTriggered` - Track geofence triggers

### User Profile
- `.profileUpdated` - Track profile changes
- `.preferenceChanged` - Track preference updates
- `.loyaltyChecked` - Track loyalty dashboard views
- `.rewardViewed` - Track reward views

## Integration Examples

### MenuBrowseView Integration
```swift
struct MenuBrowseView: View {
    @StateObject private var viewModel = MenuBrowseViewModel()

    var body: some View {
        // ... your UI
        .onAppear {
            Task {
                await EventTrackerService.shared.trackMenuViewed(
                    category: viewModel.selectedCategory
                )
            }
        }
    }
}
```

### MenuItemDetailView Integration
```swift
struct MenuItemDetailView: View {
    let menuItem: MenuItem

    var body: some View {
        // ... your UI
        .onAppear {
            Task {
                await EventTrackerService.shared.trackItemViewed(
                    itemId: menuItem.id,
                    itemName: menuItem.name,
                    category: menuItem.category,
                    price: menuItem.basePrice
                )
            }
        }
    }
}
```

### CheckoutView Integration
```swift
struct CheckoutView: View {
    @StateObject private var cartManager = CartManager.shared

    func handlePurchaseComplete(order: Order) {
        Task {
            await EventTrackerService.shared.trackPurchaseCompleted(
                orderId: order.id,
                totalAmount: order.totalAmount,
                items: cartManager.items.map { [
                    "id": $0.menuItem.id,
                    "name": $0.menuItem.name,
                    "quantity": $0.quantity,
                    "price": $0.totalPrice
                ]}
            )
        }
    }

    func handleCartAbandoned() {
        Task {
            await EventTrackerService.shared.trackCartAbandoned(
                items: cartManager.items.map { [
                    "id": $0.menuItem.id,
                    "name": $0.menuItem.name,
                    "quantity": $0.quantity
                ]},
                totalValue: cartManager.totalPrice
            )
        }
    }
}
```

### LoyaltyDashboardView Integration
```swift
struct LoyaltyDashboardView: View {
    var body: some View {
        // ... your UI
        .onAppear {
            Task {
                await EventTrackerService.shared.trackLoyaltyChecked()
            }
        }
    }
}
```

### LaunchModalView Integration
```swift
struct LaunchModalView: View {
    let promotion: Promotion

    var body: some View {
        // ... your UI
        .onAppear {
            Task {
                await EventTrackerService.shared.trackPromotionViewed(
                    promotionId: promotion.id,
                    promotionType: promotion.type
                )
            }
        }
        .onTapGesture {
            Task {
                await EventTrackerService.shared.trackPromotionClicked(
                    promotionId: promotion.id,
                    promotionType: promotion.type
                )
            }
            // Navigate to offer details
        }
    }
}
```

## Event Batching

Events are automatically batched for efficiency:
- **Batch Size**: 10 events per batch
- **Batch Interval**: 30 seconds
- **Auto-flush**: On app backgrounding/termination

You don't need to manage batching manually. The `EventTrackerManager` handles it.

## Session Management

Each app session gets a unique session ID. A new session starts when:
- App launches fresh
- App version changes (update detected)
- User explicitly starts a new session

Current session ID is accessible via:
```swift
let sessionId = EventTrackerManager.shared.currentSessionId
```

## Privacy Controls

Users can disable event tracking:

```swift
// Disable tracking (respects user privacy preference)
EventTrackerManager.shared.disableTracking()

// Enable tracking
EventTrackerManager.shared.enableTracking()

// Check if tracking is enabled
if EventTrackerManager.shared.isTrackingEnabled {
    // Track event
}
```

## Location Tracking

For geofence events, pass location data:

```swift
import CoreLocation

let location = CLLocation(latitude: 37.7749, longitude: -122.4194)

Task {
    await EventTrackerService.shared.trackLocationEntered(
        storeId: store.id,
        location: location
    )
}
```

## Custom Events

For custom events not covered by convenience methods:

```swift
Task {
    try await EventTrackerService.shared.trackEvent(
        .customEventType,
        metadata: [
            "customField1": "value1",
            "customField2": 123,
            "customArray": ["item1", "item2"]
        ]
    )
}
```

## Error Handling

All tracking methods handle errors internally and log them. Events that fail are:
1. Logged to console for debugging
2. Not retried (to avoid blocking the app)
3. Lost events are acceptable for analytics

For critical events, you can handle errors explicitly:

```swift
do {
    let response = try await EventTrackerService.shared.trackEvent(.purchaseCompleted)
    print("Event tracked successfully: \(response.event?.id ?? "")")
} catch {
    print("Failed to track event: \(error)")
    // Handle error if needed
}
```

## Testing

### Test Event Tracking in Simulator
1. Run the app
2. Navigate through screens
3. Check Xcode console for tracking logs:
   ```
   ✅ Tracked app_opened event
   ✅ Tracked menu_viewed event
   ✅ Tracked item_viewed event for Latte
   ```

### Verify Events in Backend
Query the backend API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/v1/events/history?limit=20
```

## Best Practices

1. **Track user actions, not implementation details**
   - ✅ Good: Track "menu_viewed" when user sees menu
   - ❌ Bad: Track "API call completed"

2. **Include relevant metadata**
   - Always include IDs, names, and contextual information
   - Makes events useful for ML models

3. **Use convenience methods**
   - They provide consistent metadata structure
   - Easier to maintain

4. **Don't block the UI**
   - Always use `Task { await ... }` for async tracking
   - Events run in background

5. **Respect user privacy**
   - Check tracking preference before custom tracking
   - Don't track PII unless necessary

6. **Test in production**
   - Verify events are reaching the backend
   - Monitor event statistics

## Next Steps

1. **Integrate in key views** (as shown in examples above)
2. **Test event flow** end-to-end
3. **Monitor event volume** in backend logs
4. **Set up AWS Kinesis** for real-time streaming (Phase 1 Week 2)
5. **Build ML models** using event data (Phase 2)

## Support

If you encounter issues:
1. Check console logs for error messages
2. Verify backend is running and accessible
3. Confirm user is authenticated (events require auth)
4. Check network connectivity
