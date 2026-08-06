import { useEffect, useRef, useState } from 'react';
import CurrencyBadge from './CurrencyBadge.jsx';
import styles from './CurrencyPicker.module.css';

// A styled dropdown (badge + code + name + chevron, opening a card menu)
// rather than a native <select> — native selects render as a plain OS
// control that can't show the currency badge inline.
function CurrencyPicker({ codes, value, onChange, labels, ariaLabel }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className={styles.wrap} ref={ref}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label={ariaLabel}
        aria-expanded={open}
      >
        <CurrencyBadge code={value} size={28} />
        <span className={styles.code}>{value}</span>
        <span className={styles.chevron} aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className={styles.menu} role="listbox">
          {codes.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={code === value}
              className={`${styles.option} ${code === value ? styles.optionActive : ''}`}
              onClick={() => {
                onChange(code);
                setOpen(false);
              }}
            >
              <CurrencyBadge code={code} size={26} />
              <span className={styles.optionCode}>{code}</span>
              <span className={styles.optionName}>{labels[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default CurrencyPicker;
