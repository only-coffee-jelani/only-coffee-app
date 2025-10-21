#!/usr/bin/env ruby

require 'xcodeproj'

# Path to the Xcode project
project_path = 'OnlyCoffee.xcodeproj'

# Open the project
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.first

# Get the main group
main_group = project.main_group['OnlyCoffee']

# List of files to add (relative to OnlyCoffee group, which is the OnlyCoffee directory)
# Format: { file: 'path/to/File.swift', full_path: 'OnlyCoffee/path/to/File.swift' }
files_to_add = [
  { file: 'AppDelegate.swift', full_path: 'OnlyCoffee/AppDelegate.swift' },
  { file: 'Managers/PushNotificationManager.swift', full_path: 'OnlyCoffee/Managers/PushNotificationManager.swift' },
  { file: 'Models/Coupon.swift', full_path: 'OnlyCoffee/Models/Coupon.swift' },
  { file: 'Models/Loyalty.swift', full_path: 'OnlyCoffee/Models/Loyalty.swift' },
  { file: 'Services/CouponsAPIService.swift', full_path: 'OnlyCoffee/Services/CouponsAPIService.swift' },
  { file: 'Services/LoyaltyAPIService.swift', full_path: 'OnlyCoffee/Services/LoyaltyAPIService.swift' },
  { file: 'Utilities/QRCodeGenerator.swift', full_path: 'OnlyCoffee/Utilities/QRCodeGenerator.swift' },
  { file: 'Views/Coupons/MyCouponsView.swift', full_path: 'OnlyCoffee/Views/Coupons/MyCouponsView.swift' },
  { file: 'Views/Coupons/PromoCodeEntryView.swift', full_path: 'OnlyCoffee/Views/Coupons/PromoCodeEntryView.swift' },
  { file: 'Views/Coupons/CouponSelectorView.swift', full_path: 'OnlyCoffee/Views/Coupons/CouponSelectorView.swift' },
  { file: 'Views/Coupons/CouponQRCodeView.swift', full_path: 'OnlyCoffee/Views/Coupons/CouponQRCodeView.swift' },
  { file: 'Views/Coupons/CouponCard.swift', full_path: 'OnlyCoffee/Views/Coupons/CouponCard.swift' },
  { file: 'Views/Loyalty/LoyaltyDashboardView.swift', full_path: 'OnlyCoffee/Views/Loyalty/LoyaltyDashboardView.swift' },
  { file: 'Views/Loyalty/LoyaltyViewModel.swift', full_path: 'OnlyCoffee/Views/Loyalty/LoyaltyViewModel.swift' },
  { file: 'Views/Loyalty/StreakProgressView.swift', full_path: 'OnlyCoffee/Views/Loyalty/StreakProgressView.swift' },
  { file: 'Views/Loyalty/TierBadgeView.swift', full_path: 'OnlyCoffee/Views/Loyalty/TierBadgeView.swift' },
  { file: 'Views/Notifications/NotificationPermissionView.swift', full_path: 'OnlyCoffee/Views/Notifications/NotificationPermissionView.swift' }
]

puts "\n📦 Adding #{files_to_add.length} files to project...\n\n"

files_to_add.each do |file_info|
  file_path = file_info[:file]
  full_path = file_info[:full_path]

  if File.exist?(full_path)
    filename = File.basename(file_path)

    # Check if already exists
    all_files = project.files.map(&:real_path).compact.map(&:to_s)

    if all_files.any? { |f| f.end_with?(filename) }
      puts "⚠️  #{filename} already in project"
    else
      # Add file reference to main group using relative path
      file_ref = main_group.new_reference(file_path)

      # Add to target
      target.add_file_references([file_ref])

      puts "✅ Added #{filename}"
    end
  else
    puts "❌ #{full_path} not found on disk"
  end
end

# Save the project
project.save

puts "\n✅ Project updated successfully!"
puts "You can now build the project."
