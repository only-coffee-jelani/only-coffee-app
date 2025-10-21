#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'OnlyCoffee.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.find { |t| t.name == 'OnlyCoffee' }

puts "Fixing project file references..."

# 1. Remove OAuthManager.swift reference
oauth_files = project.files.select { |f| f.path && f.path.include?('OAuthManager.swift') }
oauth_files.each do |file_ref|
  puts "Removing OAuthManager.swift reference"
  target.source_build_phase.remove_file_reference(file_ref)
  file_ref.remove_from_project
end

# 2. Remove incorrect auth file references with duplicated paths
bad_auth_files = project.files.select do |f|
  f.path && f.path.include?('OnlyCoffee/Views/Auth/OnlyCoffee/Views/Auth')
end

bad_auth_files.each do |file_ref|
  puts "Removing bad reference: #{file_ref.path}"
  target.source_build_phase.remove_file_reference(file_ref)
  file_ref.remove_from_project
end

# 3. Add auth files with correct paths
main_group = project.main_group
views_group = main_group.find_subpath('OnlyCoffee/Views', false)
auth_group = views_group.find_subpath('Auth', false) if views_group

if auth_group
  # Files to add with CORRECT paths
  files_to_add = {
    'PhoneAuthView.swift' => 'OnlyCoffee/Views/Auth/PhoneAuthView.swift',
    'VerificationCodeView.swift' => 'OnlyCoffee/Views/Auth/VerificationCodeView.swift',
    'ProfileCompletionView.swift' => 'OnlyCoffee/Views/Auth/ProfileCompletionView.swift'
  }

  files_to_add.each do |file_name, file_path|
    # Check if already exists
    existing = auth_group.files.find { |f| f.path == file_name }

    if existing
      puts "#{file_name} already exists with correct path"
    else
      # Check if file exists on disk
      unless File.exist?(file_path)
        puts "WARNING: File not found on disk: #{file_path}"
        next
      end

      # Add file reference
      file_ref = auth_group.new_reference(file_name)
      file_ref.source_tree = '<group>'

      # Add to build phase
      target.source_build_phase.add_file_reference(file_ref)

      puts "Added: #{file_name}"
    end
  end
end

# Save the project
project.save

puts "\nProject fixed successfully!"
puts "Run: rm -rf ~/Library/Developer/Xcode/DerivedData/OnlyCoffee-*"
puts "Then rebuild the project."
