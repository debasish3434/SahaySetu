import { forwardRef } from 'react';

/**
 * Reusable textarea — works seamlessly with react-hook-form v7.
 * Usage: <TextArea {...register('fieldName')} label="..." error={errors.fieldName} />
 */
const TextArea = forwardRef(
  ({ label, name, error, placeholder, rows = 4, className = '', ...rest }, ref) => (
    <div>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        placeholder={placeholder}
        ref={ref}
        className={`form-input resize-none ${error ? 'form-input-error' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="form-error">{error.message}</p>}
    </div>
  )
);

TextArea.displayName = 'TextArea';
export default TextArea;
