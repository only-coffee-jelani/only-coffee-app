#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'OnlyCoffee.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.find { |t| t.name == 'OnlyCoffee' }

puts "Step 1: Removing ALL references to PhoneAuthView, VerificationCodeView, ProfileCompletionView..."

# Remove from build phase
target.source_build_phase.files.delete_if do |build_file|
  if build_file.file_ref && build_file.file_ref.display_name
    name = build_file.file_ref.display_name
    should_delete = ['PhoneAuthView.swift', 'VerificationCodeView.swift', 'ProfileCompletionView.swift'].include?(name)
    puts "  Removing from build phase: #{name}" if should_delete
    should_delete
  else
    false
  end
end

# Remove file references from project
project.files.delete_if do |file_ref|
  if file_ref.display_name
    name = file_ref.display_name
    should_delete = ['PhoneAuthView.swift', 'VerificationCodeView.swift', 'ProfileCompletionView.swift'].include?(name)
    puts "  Removing file reference: #{name}" if should_delete
    should_delete
  else
    false
  end
end

puts "\nStep 2: Adding files back with correct paths..."

# Find or create the Auth group
main_group = project.main_group
onlycoffee_group = main_group['OnlyCoffee']

unless onlycoffee_group
  puts "ERROR: OnlyCoffee group not found"
  exit 1
end

views_group = onlycoffee_group['Views']
unless views_group
  puts "ERROR: Views group not found"
  exit 1
end

auth_group = views_group['Auth']
unless auth_group
  puts "ERROR: Auth group not found"
  exit 1
end

# Add the three new files
files_to_add = [
  'PhoneAuthView.swift',
  'VerificationCodeView.swift',
  'ProfileCompletionView.swift'
]

files_to_add.each do |filename|
  full_path = File.join('OnlyCoffee/Views/Auth', filename)

  unless File.exist?(full_path)
    puts "ERROR: File not found: #{full_path}"
    next
  end

  # Create file reference
  file_ref = auth_group.new_reference(filename)
  file_ref.source_tree = '<group>'

  # Add to sources build phase
  target.source_build_phase.add_file_reference(file_ref)

  puts "  Added: #{filename}"
end

# Save
project.save

puts "\nProject fixed! Rebuild now."
