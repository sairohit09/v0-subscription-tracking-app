import React, { useEffect, useState } from 'react'
import './SyncStatus.css'

export function SyncStatus({ status, lastSyncTime }) {
  const [displayStatus, setDisplayStatus] = useState(status)

  useEffect(() => {
    setDisplayStatus(status)
  }, [status])

  const getStatusInfo = () => {
    switch (displayStatus) {
      case 'syncing':
        return { label: 'Syncing...', icon: '⟳', className: 'syncing' }
      case 'synced':
        return { label: 'Synced', icon: '✓', className: 'synced' }
      case 'error':
        return { label: 'Sync failed', icon: '⚠', className: 'error' }
      default:
        return { label: 'Ready', icon: '◆', className: 'idle' }
    }
  }

  const info = getStatusInfo()
  const lastSyncDisplay = lastSyncTime
    ? new Date(lastSyncTime).toLocaleTimeString()
    : 'Never'

  return (
    <div className="sync-status" title={`Last sync: ${lastSyncDisplay}`}>
      <span className={`sync-icon ${info.className}`}>{info.icon}</span>
      <span className="sync-label">{info.label}</span>
    </div>
  )
}
