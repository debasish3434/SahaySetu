import { motion } from 'framer-motion';
import Spinner from './Spinner.jsx';

/**
 * Reusable animated button with a built-in loading state.
 * variant: 'primary' | 'accent' | 'outline' | 'danger'
 */
const Button = ({ children, variant = 'primary', loading = false, className = '', disabled, ...rest }) => {
  const variantClass = {
    primary: 'btn-primary',
    accent: 'btn-accent',
    outline: 'btn-outline',
    danger: 'btn-danger',
  }[variant];

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`${variantClass} ${className} w-full`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size={16} />}
      {children}
    </motion.button>
  );
};

export default Button;
