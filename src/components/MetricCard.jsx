import './MetricCard.css'

export default function MetricCard({
  id,
  label,
  value,
  unit,
  trend,
  context,
  isLoading = false,
}) {
  const getTrendColor = (color) => {
    switch (color) {
      case 'success':
        return '#10b981'
      case 'error':
        return '#ef4444'
      default:
        return '#9e9e9e'
    }
  }

  const getTrendIcon = (direction) => {
    switch (direction) {
      case 'up':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="23 6 23 12 17 6" />
          </svg>
        )
      case 'down':
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
            <polyline points="23 18 23 12 17 18" />
          </svg>
        )
      default:
        return (
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )
    }
  }

  return (
    <div className={`metric-card ${isLoading ? 'loading' : ''}`}>
      <div className="metric-header">
        <span className="metric-label">{label}</span>
        {trend && trend.direction !== 'neutral' && (
          <div
            className={`trend-badge trend-${trend.color}`}
            style={{ '--trend-color': getTrendColor(trend.color) }}
          >
            <span className="trend-icon">{getTrendIcon(trend.direction)}</span>
            <span className="trend-text">{trend.percentage.toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="metric-content">
        {isLoading ? (
          <div className="metric-skeleton" />
        ) : (
          <>
            <p className="metric-value">
              {value.toLocaleString('en-US', {
                minimumFractionDigits: unit === '$' ? 2 : 0,
                maximumFractionDigits: unit === '$' ? 2 : 0,
              })}
              <span className="metric-unit">{unit}</span>
            </p>
          </>
        )}
      </div>

      {context && (
        <div className="metric-context">
          <p>{context}</p>
        </div>
      )}
    </div>
  )
}
