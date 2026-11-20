import { forwardRef } from 'react';

/**
 * Reusable text input — works seamlessly with react-hook-form v7.
 * Usage: <Input {...register('fieldName')} label="..." error={errors.fieldName} />
 * The icon, label, and error message are layered on top via wrapper divs.
 */
const Input = forwardRef(
  ({ label, name, type = 'text', error, placeholder, icon: Icon, className = '', ...rest }, ref) => (
    <div>
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500"
            size={18}
          />
        )}
        <input
          id={name}
          name={name}
          type={type}
          placeholder={placeholder}
          ref={ref}
          className={`form-input ${Icon ? 'pl-10' : ''} ${error ? 'form-input-error' : ''} ${className}`}
          {...rest}
        />
      </div>
      {error && <p className="form-error">{error.message}</p>}
    </div>
  )
);

Input.displayName = 'Input';
export default Input;
