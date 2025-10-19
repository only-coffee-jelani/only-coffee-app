#!/usr/bin/env ruby
require 'xcodeproj'

# Open the Xcode project
project_path = 'OnlyCoffee.xcodeproj'
project = Xcodeproj::Project.open(project_path)

# Get the main target
target = project.targets.find { |t| t.name == 'OnlyCoffee' }

puts "Removing duplicate file references from build phase..."

# Get all files in the sources build phase
build_files = target.source_build_phase.files

# Group by display name
files_by_name = {}
build_files.each do |build_file|
  next unless build_file.file_ref
  name = build_file.file_ref.display_name
  files_by_name[name] ||= []
  files_by_name[name] << build_file
end

# Remove duplicates (keep only first occurrence)
duplicates_removed = 0
files_by_name.each do |name, refs|
  if refs.count > 1
    puts "Found #{refs.count} references to '#{name}' - removing #{refs.count - 1} duplicates"
    # Keep first, remove rest
    refs[1..-1].each do |build_file|
      target.source_build_phase.files.delete(build_file)
      duplicates_removed += 1
    end
  end
end

# Save the project
project.save

puts "\nRemoved #{duplicates_removed} duplicate file references"
puts "Project cleaned successfully!"
