import React, { useState, useEffect } from 'react'
import { fetchQueueTelemetry, QueueTelemetry } from '../services/queueApi'
import { Cpu, Server, Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'

export default function QueueMonitor() {
  const [telemetry, setTelemetry] = useState<QueueTelemetry>({
    broker: 'Apache Kafka (KRaft mode)',
    active_topics: ['incident-jobs', 'incident-results', 'incident-dlq'],
    consumer_group: 'incident-ai-workers',
    partitions: 3,
    queue_depth: 0,
    processing: 0,
    completed: 0,
    dlq_size: 0,
    active_workers: 2,
  })
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchQueueTelemetry()
      setTelemetry(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="view" id="view-queue">
      <div className="view-header-row">
        <div>
          <h1>
            <span className="reveal">Queue Architecture & Broker Telemetry</span>
          </h1>
          <p className="view-sub">
            Real-time Apache Kafka (KRaft consensus) and Redis state telemetry for background log analysis and LLM workers.
          </p>
        </div>
        <div className="view-header-actions">
          <button
            className="btn sm"
            onClick={loadData}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Architecture Flow Diagram */}
      <div
        className="reveal-up in-view"
        style={{
          background: 'rgba(18, 14, 28, 0.85)',
          border: '1px solid rgba(199, 125, 255, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(199, 125, 255, 0.1)', borderRadius: '10px' }}>
            <Server size={22} color="#C77DFF" />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#A098B5' }}>INGESTION GATEWAY</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>FastAPI /api/queue/jobs</div>
          </div>
        </div>

        <span style={{ color: '#C77DFF', fontSize: '18px' }}>➔</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(52, 211, 153, 0.1)', borderRadius: '10px' }}>
            <Activity size={22} color="#34D399" />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#A098B5' }}>BROKER (KRAFT)</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Apache Kafka (3 Partitions)</div>
          </div>
        </div>

        <span style={{ color: '#C77DFF', fontSize: '18px' }}>➔</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '10px' }}>
            <Cpu size={22} color="#F59E0B" />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#A098B5' }}>WORKER POOL</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>NVIDIA Nemotron Async Workers</div>
          </div>
        </div>

        <span style={{ color: '#C77DFF', fontSize: '18px' }}>➔</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px' }}>
            <CheckCircle size={22} color="#60A5FA" />
          </div>
          <div>
            <span style={{ fontSize: '11px', color: '#A098B5' }}>CACHE LAYER</span>
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#FFF' }}>Redis TTL Result Store</div>
          </div>
        </div>
      </div>

      {/* 4 Telemetry Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div
          style={{
            background: '#0D0A14',
            border: '1px solid rgba(199, 125, 255, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#A098B5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Queue Depth
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#C77DFF', fontFamily: 'monospace', marginTop: '6px' }}>
            {telemetry.queue_depth}
          </div>
          <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>Messages awaiting workers</div>
        </div>

        <div
          style={{
            background: '#0D0A14',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#A098B5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Active Processing
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#F59E0B', fontFamily: 'monospace', marginTop: '6px' }}>
            {telemetry.processing}
          </div>
          <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>Jobs in Nemotron pipeline</div>
        </div>

        <div
          style={{
            background: '#0D0A14',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#A098B5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Processed Tasks
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#34D399', fontFamily: 'monospace', marginTop: '6px' }}>
            {telemetry.completed}
          </div>
          <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>Completed successfully</div>
        </div>

        <div
          style={{
            background: '#0D0A14',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '12px',
            padding: '16px',
          }}
        >
          <div style={{ fontSize: '11px', color: '#A098B5', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Dead Letter Queue (DLQ)
          </div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#EF4444', fontFamily: 'monospace', marginTop: '6px' }}>
            {telemetry.dlq_size}
          </div>
          <div style={{ fontSize: '11px', color: '#A098B5', marginTop: '4px' }}>Exhausted after 3 retries</div>
        </div>
      </div>

      {/* Kafka Topics & Partitions Overview */}
      <div
        style={{
          background: 'rgba(18, 14, 28, 0.85)',
          border: '1px solid rgba(58, 46, 82, 0.8)',
          borderRadius: '16px',
          padding: '20px',
        }}
      >
        <h3 style={{ fontSize: '15px', color: '#FFF', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="#C77DFF" />
          <span>Active Kafka Topics (KRaft Cluster)</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {telemetry.active_topics.map((t) => (
            <div
              key={t}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 16px',
                background: '#08060D',
                borderRadius: '8px',
                border: '1px solid rgba(58, 46, 82, 0.6)',
              }}
            >
              <div>
                <b style={{ color: '#E879F9', fontFamily: 'monospace' }}>{t}</b>
                <span style={{ fontSize: '11px', color: '#A098B5', marginLeft: '12px' }}>
                  {t.includes('dlq') ? 'Dead letter routing' : 'High-throughput async job stream'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#A098B5' }}>
                <span>Partitions: <b style={{ color: '#FFF' }}>{t.includes('dlq') ? 1 : 3}</b></span>
                <span>Replication: <b style={{ color: '#FFF' }}>1</b></span>
                <span style={{ color: '#34D399' }}>✓ Healthy</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
