#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'OnlyCoffee.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.find { |t| t.name == 'OnlyCoffee' }

# Get the main group
main_group = project.main_group

# Find or create Views/Auth group
views_group = main_group.find_subpath('OnlyCoffee/Views', true)
auth_group = views_group.find_subpath('Auth', true)

# Files to add
files_to_add = [
  'OnlyCoffee/Views/Auth/PhoneAuthView.swift',
  'OnlyCoffee/Views/Auth/VerificationCodeView.swift',
  'OnlyCoffee/Views/Auth/ProfileCompletionView.swift'
]

files_to_add.each do |file_path|
  file_name = File.basename(file_path)

  # Check if file already exists in project
  existing_file = auth_group.files.find { |f| f.path == file_name }

  if existing_file
    puts "File already exists in project: #{file_name}"
    next
  end

  # Check if file exists on disk
  unless File.exist?(file_path)
    puts "File not found on disk: #{file_path}"
    next
  end

  # Add file reference to the group
  file_ref = auth_group.new_reference(file_path)

  # Add file to the target's sources build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "Added: #{file_name}"
end

# Save the project
project.save

puts "\nProject updated successfully!"
puts "Please clean and rebuild in Xcode."
