import { forwardRef } from 'react';

/**
 * Reusable select dropdown — works seamlessly with react-hook-form v7.
 * Usage: <Select {...register('fieldName')} options={[...]} error={errors.fieldName} />
 */
const Select = forwardRef(
  ({ label, name, error, options = [], placeholder, className = '', ...rest }, ref) => (
    <div>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}
      <select
        id={name}
        name={name}
        ref={ref}
        className={`form-input ${error ? 'form-input-error' : ''} ${className}`}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="form-error">{error.message}</p>}
    </div>
  )
);

Select.displayName = 'Select';
export default Select;
