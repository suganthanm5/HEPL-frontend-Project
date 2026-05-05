import { useState, useRef, useEffect } from 'react';
import './SearchableSelect.css';

const IconChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SearchableSelect = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = 'Select option...', 
  searchPlaceholder = 'Search...',
  disabled = false,
  required = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option =>
    option.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected option display text
  const selectedOption = options.find(opt => opt.id === value);
  const displayText = selectedOption ? selectedOption.name : '';

  // Handle option selection
  const handleSelect = (option) => {
    onChange(option.id, option.name);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Handle clear selection
  const handleClear = (e) => {
    e.stopPropagation();
    onChange('', '');
    setSearchTerm('');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div className={`searchable-select ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <div 
        className={`select-trigger ${isOpen ? 'open' : ''} ${value ? 'has-value' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className="select-value">
          {displayText || placeholder}
        </span>
        <div className="select-actions">
          {value && !disabled && (
            <button 
              type="button" 
              className="clear-btn" 
              onClick={handleClear}
              title="Clear selection"
            >
              <IconX />
            </button>
          )}
          <span className="chevron">
            <IconChevronDown />
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="select-dropdown">
          <div className="search-box">
            <IconSearch />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="options-list">
            {filteredOptions.length === 0 ? (
              <div className="no-options">
                {searchTerm ? 'No locations found' : 'No locations available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`option-item ${option.id === value ? 'selected' : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {option.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;