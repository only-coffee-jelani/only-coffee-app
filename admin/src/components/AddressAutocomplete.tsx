import React, { useState, useRef, useEffect } from 'react';
import { FiMapPin, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { useAddressAutocomplete, AddressSuggestion } from '../hooks/useAddressAutocomplete';

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectSuggestion: (suggestion: AddressSuggestion) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  onSelectSuggestion,
  placeholder = 'Street address',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { suggestions, loading, error, getAddressSuggestions, clearSuggestions } = useAddressAutocomplete();

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    if (newValue.length >= 2) {
      setIsOpen(true);
      getAddressSuggestions(newValue);
    } else {
      setIsOpen(false);
      clearSuggestions();
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(suggestion.address);
    onSelectSuggestion(suggestion);
    setIsOpen(false);
    clearSuggestions();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => value.length >= 3 && suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full px-4 py-3 border-2 border-pink-100 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white transition-all ${className}`}
          autoComplete="off"
        />
        
        {/* Loading Indicator */}
        {loading && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            <FiLoader size={18} className="animate-spin text-pink-500" />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
          <FiAlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-pink-100 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => handleSelectSuggestion(suggestion)}
              className="w-full text-left px-4 py-3 hover:bg-pink-50 border-b border-pink-50 last:border-b-0 transition-colors flex items-start gap-3 group"
            >
              <FiMapPin size={18} className="text-pink-500 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                  {suggestion.address}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {suggestion.city}
                  {suggestion.state && `, ${suggestion.state}`}
                  {suggestion.zipCode && ` ${suggestion.zipCode}`}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {isOpen && !loading && suggestions.length === 0 && value.length >= 2 && !error && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-pink-100 rounded-xl shadow-lg z-50 p-4 text-center text-gray-600">
          <p>No addresses found. Try a different search.</p>
        </div>
      )}

      {/* Helper Text */}
      {value.length > 0 && value.length < 2 && (
        <p className="mt-2 text-xs text-gray-500">
          Type at least 2 characters to see suggestions
        </p>
      )}
    </div>
  );
};

export default AddressAutocomplete;

