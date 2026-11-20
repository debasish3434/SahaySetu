import React from 'react';

/**
 * Displayed when a list has no data. Frames the empty screen as an invitation to act,
 * per the app's design voice, rather than a dead end.
 */
const EmptyState = ({ icon: Icon, title, description, message, action }) => {
  const subtitle = description || message;

  const renderIcon = () => {
    if (!Icon) return null;
    if (React.isValidElement(Icon)) {
      return Icon;
    }
    return <Icon size={26} />;
  };

  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-300 bg-white px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          {renderIcon()}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-ink-900">{title}</h3>
      {subtitle && <p className="mt-1.5 max-w-sm text-sm text-ink-500">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
};

export default EmptyState;
