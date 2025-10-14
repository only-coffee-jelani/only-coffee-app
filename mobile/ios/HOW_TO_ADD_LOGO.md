# How to Add Your Logo to the iOS App

## Quick Instructions

### 1. Prepare Your Logo
Your logo should be:
- **PNG format** with transparent background (recommended)
- **High resolution** (at least 1024x1024 pixels)
- **Square or horizontal** orientation works best

### 2. Add Logo to Assets

**Option A: Using Xcode (Recommended)**
1. Open the project in Xcode:
   ```bash
   cd mobile/ios
   open OnlyCoffee.xcodeproj
   ```
2. In the left sidebar, navigate to: `OnlyCoffee` > `Assets.xcassets`
3. Right-click in the assets area and select "New Image Set"
4. Name it exactly: `Logo`
5. Drag your logo files into the slots:
   - **1x**: Your logo at base size (e.g., 120x40 pixels)
   - **2x**: Your logo at 2x size (e.g., 240x80 pixels)
   - **3x**: Your logo at 3x size (e.g., 360x120 pixels)

**Option B: Using Finder**
1. Navigate to: `mobile/ios/OnlyCoffee/Assets.xcassets/`
2. Create a new folder named: `Logo.imageset`
3. Add these files inside:
   - `Logo.png` (1x version)
   - `Logo@2x.png` (2x version)
   - `Logo@3x.png` (3x version)
   - `Contents.json` (see template below)

### 3. Contents.json Template
If adding manually, create `Contents.json` with:

```json
{
  "images" : [
    {
      "filename" : "Logo.png",
      "idiom" : "universal",
      "scale" : "1x"
    },
    {
      "filename" : "Logo@2x.png",
      "idiom" : "universal",
      "scale" : "2x"
    },
    {
      "filename" : "Logo@3x.png",
      "idiom" : "universal",
      "scale" : "3x"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

## File Structure

After adding, your folder structure should look like:

```
mobile/ios/OnlyCoffee/Assets.xcassets/
├── AppIcon.appiconset/
│   └── ...
├── AccentColor.colorset/
│   └── ...
└── Logo.imageset/
    ├── Logo.png          (1x - e.g., 120x40px)
    ├── Logo@2x.png       (2x - e.g., 240x80px)
    ├── Logo@3x.png       (3x - e.g., 360x120px)
    └── Contents.json
```

## Logo Recommendations

### Dimensions
- **Header Logo**: Horizontal format, height ~40-50 points
- **Suggested sizes**:
  - 1x: 120x40 or 150x50 pixels
  - 2x: 240x80 or 300x100 pixels
  - 3x: 360x120 or 450x150 pixels

### Colors
- Since the background is pink (#ff93a3), your logo should:
  - Use **white** as the primary color, OR
  - Have a **transparent background** with contrasting colors

### Format
- **PNG** with transparency is best
- **SVG** can be converted to PNG at different sizes
- Avoid **JPEG** (no transparency support)

## Where the Logo Appears

The logo currently appears:
- **Top center** of the main app header (on all tabs)
- Configured in `Theme.swift` > `BrandHeader`
- Height set to 40 points (automatically scales)

## Adjusting Logo Size

If you need to change the logo size after adding, edit `Theme.swift`:

```swift
// In BrandHeader view
Image("Logo")
    .resizable()
    .scaledToFit()
    .frame(height: 40)  // Change this number
```

## Troubleshooting

### Logo Not Showing
1. **Check the name**: Must be exactly `Logo` (case-sensitive)
2. **Rebuild**: Cmd+Shift+K (clean) then Cmd+B (build)
3. **Restart Xcode**: Sometimes assets need a fresh start
4. **Verify path**: Make sure files are in `Assets.xcassets/Logo.imageset/`

### Logo Too Big/Small
- Edit the `frame(height: 40)` value in `Theme.swift`
- Common values: 30 (small), 40 (default), 50 (large)

### Logo Looks Blurry
- Make sure you provided 2x and 3x versions
- Check that images are high resolution
- PNG should be at least 300 DPI

## Quick Test

After adding your logo:
1. Build and run the app: Cmd+R
2. Logo should appear at the top center
3. Should be visible on all tabs (Stores, Orders, Rewards, Profile)

## Need Help?

If the logo still doesn't show:
1. Check Xcode console for any asset loading errors
2. Verify file permissions: `ls -la mobile/ios/OnlyCoffee/Assets.xcassets/Logo.imageset/`
3. Try creating a simple test logo (solid color rectangle) to confirm the system works
