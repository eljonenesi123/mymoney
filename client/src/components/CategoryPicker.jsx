import styles from './CategoryPicker.module.css';

function CategoryPicker({ categories, value, onChange }) {
  return (
    <div className={styles.grid}>
      {categories.map((cat) => (
        <button
          type="button"
          key={cat._id}
          className={styles.chip}
          data-active={value === cat._id}
          style={{ '--cat-color': cat.color }}
          onClick={() => onChange(cat._id)}
        >
          <span className={styles.icon}>{cat.icon}</span>
          {cat.name}
        </button>
      ))}
    </div>
  );
}

export default CategoryPicker;
