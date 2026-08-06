// Inline SVG badge instead of flag emoji — flag emoji render blank on
// Windows and many Android builds (no color-flag glyphs in the system
// font), which is invisible in Mac-based testing but breaks for a lot of
// real users. An SVG circle is guaranteed to render everywhere.
const CURRENCY_STYLE = {
  ALL: { symbol: 'L', color: '#D4A857' },
  EUR: { symbol: '€', color: '#6E8CA0' },
  USD: { symbol: '$', color: '#7FA37F' },
  GBP: { symbol: '£', color: '#8B7398' },
};

function CurrencyBadge({ code, size = 36 }) {
  const style = CURRENCY_STYLE[code] || { symbol: code[0], color: '#8B8378' };
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label={code}>
      <circle cx="18" cy="18" r="18" fill={style.color} />
      <text
        x="18"
        y="19"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="Inter, system-ui, sans-serif"
        fontWeight="700"
        fontSize={size >= 32 ? '15' : '12'}
        fill="#ffffff"
      >
        {style.symbol}
      </text>
    </svg>
  );
}

export default CurrencyBadge;
