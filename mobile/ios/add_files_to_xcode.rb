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

# Helper function to create group if it doesn't exist
def get_or_create_group(parent_group, group_name, path)
  group = parent_group[group_name]
  if group.nil?
    group = parent_group.new_group(group_name, path)
    puts "📁 Created group: #{group_name}"
  end
  group
end

# Helper function to add file to group
def add_file_to_group(group, file_path, target)
  if File.exist?(file_path)
    # Check if file is already in the group
    filename = File.basename(file_path)
    existing = group.files.find { |f| f.path == filename }
    if existing.nil?
      # Use just the filename, not the full path, since the group already has the directory path
      file_ref = group.new_file(filename)
      target.add_file_references([file_ref])
      puts "✅ Added #{filename}"
    else
      puts "⚠️  #{filename} already exists in project"
    end
  else
    puts "❌ #{file_path} not found"
  end
end

# Create necessary groups
managers_group = get_or_create_group(main_group, 'Managers', 'OnlyCoffee/Managers')
models_group = get_or_create_group(main_group, 'Models', 'OnlyCoffee/Models')
services_group = get_or_create_group(main_group, 'Services', 'OnlyCoffee/Services')
utilities_group = get_or_create_group(main_group, 'Utilities', 'OnlyCoffee/Utilities')

# Create Views group and subgroups
views_group = get_or_create_group(main_group, 'Views', 'OnlyCoffee/Views')
coupons_views_group = get_or_create_group(views_group, 'Coupons', 'OnlyCoffee/Views/Coupons')
loyalty_views_group = get_or_create_group(views_group, 'Loyalty', 'OnlyCoffee/Views/Loyalty')
notifications_views_group = get_or_create_group(views_group, 'Notifications', 'OnlyCoffee/Views/Notifications')

puts "\n📦 Adding files to project...\n\n"

# Add AppDelegate to main OnlyCoffee group
add_file_to_group(main_group, 'OnlyCoffee/AppDelegate.swift', target)

# Add Managers
add_file_to_group(managers_group, 'OnlyCoffee/Managers/PushNotificationManager.swift', target)

# Add Models
add_file_to_group(models_group, 'OnlyCoffee/Models/Coupon.swift', target)
add_file_to_group(models_group, 'OnlyCoffee/Models/Loyalty.swift', target)

# Add Services
add_file_to_group(services_group, 'OnlyCoffee/Services/CouponsAPIService.swift', target)
add_file_to_group(services_group, 'OnlyCoffee/Services/LoyaltyAPIService.swift', target)

# Add Utilities
add_file_to_group(utilities_group, 'OnlyCoffee/Utilities/QRCodeGenerator.swift', target)

# Add Coupon Views
add_file_to_group(coupons_views_group, 'OnlyCoffee/Views/Coupons/MyCouponsView.swift', target)
add_file_to_group(coupons_views_group, 'OnlyCoffee/Views/Coupons/PromoCodeEntryView.swift', target)
add_file_to_group(coupons_views_group, 'OnlyCoffee/Views/Coupons/CouponSelectorView.swift', target)
add_file_to_group(coupons_views_group, 'OnlyCoffee/Views/Coupons/CouponQRCodeView.swift', target)
add_file_to_group(coupons_views_group, 'OnlyCoffee/Views/Coupons/CouponCard.swift', target)

# Add Loyalty Views
add_file_to_group(loyalty_views_group, 'OnlyCoffee/Views/Loyalty/LoyaltyDashboardView.swift', target)
add_file_to_group(loyalty_views_group, 'OnlyCoffee/Views/Loyalty/LoyaltyViewModel.swift', target)
add_file_to_group(loyalty_views_group, 'OnlyCoffee/Views/Loyalty/StreakProgressView.swift', target)
add_file_to_group(loyalty_views_group, 'OnlyCoffee/Views/Loyalty/TierBadgeView.swift', target)

# Add Notification Views
add_file_to_group(notifications_views_group, 'OnlyCoffee/Views/Notifications/NotificationPermissionView.swift', target)

# Save the project
project.save

puts "\n✅ Project updated successfully!"
puts "You can now build the project in Xcode or via xcodebuild."
