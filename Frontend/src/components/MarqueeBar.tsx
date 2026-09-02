export default function MarqueeBar() {
  const items = ['18 services connected', 'Model guard active', 'Collector streaming live']
  return (
    <div className="marquee-bar">
      <div className="marquee-track">
        {[...items, ...items].map((t, i) => (
          <span key={i}>{t}</span>
        ))}
      </div>
    </div>
  )
}
