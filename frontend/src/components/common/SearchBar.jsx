import { useState, useEffect } from 'react';
import { LuSearch } from 'react-icons/lu';

const SearchBar = ({ placeholder = 'Search...', onSearch, value, onChange, className = '' }) => {
  const [internalQuery, setInternalQuery] = useState('');
  const isControlled = value !== undefined;
  const query = isControlled ? value : internalQuery;

  useEffect(() => {
    if (!onSearch) return undefined;
    const timer = setTimeout(() => {
      onSearch(query);
    }, 400);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  const handleChange = (e) => {
    const next = e.target.value;
    if (isControlled) {
      onChange?.(next);
    } else {
      setInternalQuery(next);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" size={18} />
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        className="form-input pl-10"
      />
    </div>
  );
};

export default SearchBar;
