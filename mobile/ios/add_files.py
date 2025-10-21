#!/usr/bin/env python3
"""
Simple script to add Swift files to Xcode project
"""
import os
import uuid
import re

# Paths
PROJECT_FILE = 'OnlyCoffee.xcodeproj/project.pbxproj'

# Files to add
FILES_TO_ADD = [
    # Managers
    {
        'path': 'OnlyCoffee/AppDelegate.swift',
        'name': 'AppDelegate.swift',
        'group': 'OnlyCoffee'
    },
    {
        'path': 'OnlyCoffee/Managers/PushNotificationManager.swift',
        'name': 'PushNotificationManager.swift',
        'group': 'Managers'
    },
    # Models
    {
        'path': 'OnlyCoffee/Models/Coupon.swift',
        'name': 'Coupon.swift',
        'group': 'Models'
    },
    {
        'path': 'OnlyCoffee/Models/Loyalty.swift',
        'name': 'Loyalty.swift',
        'group': 'Models'
    },
    # Services
    {
        'path': 'OnlyCoffee/Services/CouponsAPIService.swift',
        'name': 'CouponsAPIService.swift',
        'group': 'Services'
    },
    {
        'path': 'OnlyCoffee/Services/LoyaltyAPIService.swift',
        'name': 'LoyaltyAPIService.swift',
        'group': 'Services'
    },
    # Utilities
    {
        'path': 'OnlyCoffee/Utilities/QRCodeGenerator.swift',
        'name': 'QRCodeGenerator.swift',
        'group': 'Utilities'
    },
    # Coupon Views
    {
        'path': 'OnlyCoffee/Views/Coupons/MyCouponsView.swift',
        'name': 'MyCouponsView.swift',
        'group': 'Views/Coupons'
    },
    {
        'path': 'OnlyCoffee/Views/Coupons/PromoCodeEntryView.swift',
        'name': 'PromoCodeEntryView.swift',
        'group': 'Views/Coupons'
    },
    {
        'path': 'OnlyCoffee/Views/Coupons/CouponSelectorView.swift',
        'name': 'CouponSelectorView.swift',
        'group': 'Views/Coupons'
    },
    {
        'path': 'OnlyCoffee/Views/Coupons/CouponQRCodeView.swift',
        'name': 'CouponQRCodeView.swift',
        'group': 'Views/Coupons'
    },
    {
        'path': 'OnlyCoffee/Views/Coupons/CouponCard.swift',
        'name': 'CouponCard.swift',
        'group': 'Views/Coupons'
    },
    # Loyalty Views
    {
        'path': 'OnlyCoffee/Views/Loyalty/LoyaltyDashboardView.swift',
        'name': 'LoyaltyDashboardView.swift',
        'group': 'Views/Loyalty'
    },
    {
        'path': 'OnlyCoffee/Views/Loyalty/LoyaltyViewModel.swift',
        'name': 'LoyaltyViewModel.swift',
        'group': 'Views/Loyalty'
    },
    {
        'path': 'OnlyCoffee/Views/Loyalty/StreakProgressView.swift',
        'name': 'StreakProgressView.swift',
        'group': 'Views/Loyalty'
    },
    {
        'path': 'OnlyCoffee/Views/Loyalty/TierBadgeView.swift',
        'name': 'TierBadgeView.swift',
        'group': 'Views/Loyalty'
    },
    # Notifications
    {
        'path': 'OnlyCoffee/Views/Notifications/NotificationPermissionView.swift',
        'name': 'NotificationPermissionView.swift',
        'group': 'Views/Notifications'
    }
]

def generate_uuid():
    """Generate a 24-character hex UUID like Xcode uses"""
    return uuid.uuid4().hex[:24].upper()

def add_files_to_project():
    """Add files to the Xcode project"""

    # Read the project file
    with open(PROJECT_FILE, 'r') as f:
        content = f.read()

    # Check if files already exist in project
    for file_info in FILES_TO_ADD:
        if file_info['name'] in content:
            print(f"⚠️  {file_info['name']} already exists in project")
            continue

        if not os.path.exists(file_info['path']):
            print(f"❌ {file_info['path']} not found on disk")
            continue

        # Generate UUIDs for this file
        file_ref_uuid = generate_uuid()
        build_file_uuid = generate_uuid()

        print(f"Adding {file_info['name']}...")
        print(f"  File Ref UUID: {file_ref_uuid}")
        print(f"  Build File UUID: {build_file_uuid}")

        # 1. Add PBXFileReference
        file_ref_section = re.search(r'/\* Begin PBXFileReference section \*/(.*?)/\* End PBXFileReference section \*/', content, re.DOTALL)
        if file_ref_section:
            new_file_ref = f'\t\t{file_ref_uuid} /* {file_info["name"]} */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = {file_info["name"]}; sourceTree = "<group>"; }};\n'
            insert_pos = file_ref_section.end(1)
            content = content[:insert_pos] + new_file_ref + content[insert_pos:]
            print(f"  ✅ Added PBXFileReference")

        # 2. Add PBXBuildFile
        build_file_section = re.search(r'/\* Begin PBXBuildFile section \*/(.*?)/\* End PBXBuildFile section \*/', content, re.DOTALL)
        if build_file_section:
            new_build_file = f'\t\t{build_file_uuid} /* {file_info["name"]} in Sources */ = {{isa = PBXBuildFile; fileRef = {file_ref_uuid} /* {file_info["name"]} */; }};\n'
            insert_pos = build_file_section.end(1)
            content = content[:insert_pos] + new_build_file + content[insert_pos:]
            print(f"  ✅ Added PBXBuildFile")

        # 3. Add to PBXSourcesBuildPhase (Sources)
        sources_section = re.search(r'(\w+) /\* Sources \*/ = \{[^}]*isa = PBXSourcesBuildPhase;[^}]*files = \((.*?)\);', content, re.DOTALL)
        if sources_section:
            new_source = f'\t\t\t\t{build_file_uuid} /* {file_info["name"]} in Sources */,\n'
            insert_pos = sources_section.end(2)
            content = content[:insert_pos] + new_source + content[insert_pos:]
            print(f"  ✅ Added to Sources build phase")

        # 4. Add to appropriate PBXGroup
        # Find the OnlyCoffee group
        onlycoffee_group = re.search(r'(\w+) /\* OnlyCoffee \*/ = \{[^}]*isa = PBXGroup;[^}]*children = \((.*?)\);', content, re.DOTALL)
        if onlycoffee_group:
            children_section = onlycoffee_group.group(2)
            # Check if Utilities or Components group exists
            group_match = re.search(rf'(\w+) /\* {file_info["group"]} \*/', children_section)

            if not group_match:
                # Create the group
                group_uuid = generate_uuid()
                new_group = f'\t\t{group_uuid} /* {file_info["group"]} */ = {{\n\t\t\tisa = PBXGroup;\n\t\t\tchildren = (\n\t\t\t\t{file_ref_uuid} /* {file_info["name"]} */,\n\t\t\t);\n\t\t\tpath = {file_info["group"]};\n\t\t\tsourceTree = "<group>";\n\t\t}};\n'

                # Add group definition
                group_section = re.search(r'/\* End PBXFileReference section \*/', content)
                if group_section:
                    insert_pos = group_section.end()
                    content = content[:insert_pos] + '\n' + new_group + content[insert_pos:]
                    print(f"  ✅ Created {file_info['group']} group")

                # Add group to OnlyCoffee children
                new_child = f'\t\t\t\t{group_uuid} /* {file_info["group"]} */,\n'
                insert_pos = onlycoffee_group.end(2)
                content = content[:insert_pos] + new_child + content[insert_pos:]
                print(f"  ✅ Added group to OnlyCoffee")
            else:
                # Group exists, add file to it
                group_uuid = group_match.group(1)
                group_def = re.search(rf'{group_uuid} /\* {file_info["group"]} \*/ = \{{[^}}]*children = \((.*?)\);', content, re.DOTALL)
                if group_def:
                    new_child = f'\t\t\t\t{file_ref_uuid} /* {file_info["name"]} */,\n'
                    insert_pos = group_def.end(1)
                    content = content[:insert_pos] + new_child + content[insert_pos:]
                    print(f"  ✅ Added to existing {file_info['group']} group")

        print(f"✅ Successfully added {file_info['name']}\n")

    # Write back to file
    with open(PROJECT_FILE, 'w') as f:
        f.write(content)

    print("✅ Project file updated successfully!")
    print("\nYou can now build the project:")
    print("  xcodebuild build -scheme OnlyCoffee -destination 'platform=iOS Simulator,name=iPhone 16 Pro,OS=18.3.1'")

if __name__ == '__main__':
    add_files_to_project()
