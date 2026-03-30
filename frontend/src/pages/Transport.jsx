import CostInput from '../components/CostInput'
import { useState, useRef, useEffect, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const TYPE_STYLE = {
  Flight:   { label:'✈️ Flight',   bg:'#FDECEA', color:'var(--red)',    border:'var(--red)'    },
  HSR:      { label:'🚄 HSR',      bg:'#EBF5FB', color:'#5b9bd5',      border:'#2980B9'       },
  Bus:      { label:'🚌 Bus',      bg:'#EAFAF1', color:'var(--booked)', border:'var(--booked)' },
  Transfer: { label:'🚗 Transfer', bg:'#FFF8DC', color:'#7D6608',      border:'var(--gold)'   },
}

// ── Location search input with Mapbox geocoding ──────────────
function LocationSearch({ value, onChange, placeholder, onCoordsChange }) {
  const [query, setQuery]       = useState(value || '')
  const [results, setResults]   = useState([])
  const [loading, setLoading]   = useState(false)
  const [open, setOpen]         = useState(false)
  const debounceRef             = useRef(null)
  const wrapperRef              = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const search = useCallback((q) => {
    if (!q || q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&limit=6&language=en`
        const res = await fetch(url)
        const data = await res.json()
        setResults(data.features || [])
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
  }, [])

  const select = (feature) => {
    const name = feature.place_name
    const [lng, lat] = feature.geometry.coordinates
    setQuery(name)
    setResults([])
    setOpen(false)
    onChange(name, lat, lng)
  }

  return (
    <div ref={wrapperRef} style={{ position:'relative', width:'100%' }}>
      <div style={{ position:'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value) }}
          onFocus={() => { if (results.length > 0) setOpen(true) }}
          placeholder={placeholder || 'Search location…'}
          style={{ width:'100%', paddingRight:28 }}
        />
        {loading && (
          <span style={{
            position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
            fontSize:11, color:'var(--ink-soft)',
          }}>⟳</span>
        )}
        {!loading && query && (
          <span
            onClick={() => { setQuery(''); setResults([]); setOpen(false); onChange('') }}
            style={{
              position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
              fontSize:14, color:'var(--ink-soft)', cursor:'pointer', lineHeight:1,
            }}
          >×</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999,
          background:'var(--card-bg)', borderRadius:10,
          boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          border:'1.5px solid var(--border)',
          overflow:'hidden', maxHeight:260, overflowY:'auto',
        }}>
          {results.map((feat) => {
            // Split full place name into primary + context
            const parts = feat.place_name.split(', ')
            const primary = parts[0]
            const context = parts.slice(1).join(', ')
            return (
              <div
                key={feat.id}
                onMouseDown={() => select(feat)}
                style={{
                  padding:'10px 14px', cursor:'pointer',
                  borderBottom:'1px solid var(--border)',
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--mist)'}
                onMouseLeave={e => e.currentTarget.style.background = 'white'}
              >
                <div style={{ fontSize:13, fontWeight:500, color:'var(--ink)' }}>
                  📍 {primary}
                </div>
                {context && (
                  <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>
                    {context}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {open && results.length === 0 && query.length >= 2 && !loading && (
        <div style={{
          position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:999,
          background:'var(--card-bg)', borderRadius:10, padding:'12px 14px',
          boxShadow:'0 8px 32px rgba(0,0,0,0.18)',
          border:'1.5px solid var(--border)',
          fontSize:12, color:'var(--ink-soft)',
        }}>
          No results for "{query}"
        </div>
      )}
    </div>
  )
}

// ── Label wrapper ────────────────────────────────────────────
function F({ label, children, style }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:4, ...style }}>
      <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:600 }}>{label}</span>
      {children}
    </label>
  )
}

// ── Individual transport row ─────────────────────────────────
function TransportRow({ t, idx, provided, snapshot }) {
  const [open, setOpen] = useState(false)
  const { theme, updateTransport, deleteTransport, fmt, fmtInput, parseCost } = useStore()
  const u = (f, v) => updateTransport(t.id, f, v)
  const booked = t.status === 'BOOKED' || t.status === '✅ BOOKED'
  const ts = TYPE_STYLE[t.type] || TYPE_STYLE.Transfer

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={{
        marginBottom:8,
        opacity: snapshot.isDragging ? 0.85 : 1,
        ...provided.draggableProps.style,
      }}
    >
      {/* ── Collapsed row ── */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'28px 32px 90px 110px 1fr 1fr 80px 80px 80px 100px 90px 90px',
        gap:8, alignItems:'center',
        background:'var(--card-bg)', padding:'12px 14px',
        borderRadius: open ? '12px 12px 0 0' : 12,
        boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow)',
        borderLeft:`3px solid ${ts.border}`,
        transition:'box-shadow 0.15s',
      }}>
        <span {...provided.dragHandleProps} style={{
          color:'var(--border)', fontSize:16, cursor:'grab', userSelect:'none',
          display:'flex', alignItems:'center', justifyContent:'center',
        }}>⠿</span>

        <span style={{
          fontFamily:'DM Mono,monospace', fontSize:11, fontWeight:700,
          color:'white', background:'var(--red)',
          borderRadius:10, padding:'1px 6px', textAlign:'center',
        }}>{idx + 1}</span>

        {[
          t.date, null, t.from_city, t.to_city,
          t.dep_time, t.arr_time, t.duration, t.flight_num,
        ].map((val, i) => {
          if (i === 1) return (
            <span key="type" style={{
              padding:'3px 10px', borderRadius:10, fontSize:11, fontWeight:600,
              background:ts.bg, color:ts.color, textAlign:'center', whiteSpace:'nowrap', cursor:'pointer',
            }} onClick={() => setOpen(o => !o)}>{ts.label}</span>
          )
          return (
            <span key={i} style={{
              fontSize: i <= 1 ? 12 : 11,
              fontWeight: i === 0 ? 500 : 400,
              fontFamily: [4,5].includes(i) ? 'DM Mono,monospace' : 'inherit',
              color: 'var(--ink-soft)',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              cursor:'pointer',
            }} onClick={() => setOpen(o => !o)}>{val}</span>
          )
        })}

        <span style={{
          fontFamily:'DM Mono,monospace', fontSize:12, color:'var(--red)', fontWeight:500, cursor:'pointer',
        }} onClick={() => setOpen(o => !o)}>
          {t.cost_cny > 0 ? fmt(t.cost_cny) : '—'}
        </span>
        <span style={{
          padding:'2px 8px', borderRadius:10, fontSize:11, fontWeight:600, textAlign:'center',
          background: booked ? 'var(--booked-bg)' : '#FEF9E7',
          color: booked ? 'var(--booked)' : '#7D6608', cursor:'pointer',
        }} onClick={() => setOpen(o => !o)}>{booked ? '✅ Booked' : '⏳ Pending'}</span>
      </div>

      {/* ── Expanded edit panel ── */}
      {open && (
        <div style={{
          background:'var(--mist)', borderRadius:'0 0 12px 12px',
          padding:18, display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12,
        }}>
          <F label="Date">
            <input defaultValue={t.date} onBlur={e => u('date', e.target.value)}
                      readOnly={!isAuthed} />
          </F>

          {/* Location search fields */}
          <F label="From — search or type">
            <LocationSearch
              value={t.from_city}
              placeholder="e.g. Shanghai Pudong Airport"
              onChange={(val, lat, lng) => {
                u('from_city', val)
                if (lat !== undefined) { u('from_lat', lat); u('from_lng', lng) }
              }}
            />
          </F>
          <F label="To — search or type">
            <LocationSearch
              value={t.to_city}
              placeholder="e.g. Qionghai Boao Airport"
              onChange={(val, lat, lng) => {
                u('to_city', val)
                if (lat !== undefined) { u('to_lat', lat); u('to_lng', lng) }
              }}
            />
          </F>

          <F label="Depart">
            <input defaultValue={t.dep_time} onBlur={e => u('dep_time', e.target.value)}
                      readOnly={!isAuthed} />
          </F>
          <F label="Arrive">
            <input defaultValue={t.arr_time} onBlur={e => u('arr_time', e.target.value)}
                      readOnly={!isAuthed} />
          </F>
          <F label="Duration">
            <input defaultValue={t.duration} onBlur={e => u('duration', e.target.value)}
                      readOnly={!isAuthed} />
          </F>
          <F label="Flight / Train #">
            <input defaultValue={t.flight_num} onBlur={e => u('flight_num', e.target.value)}
                      readOnly={!isAuthed} />
          </F>

          <F label="Type">
            <select defaultValue={t.type} onChange={e => u('type', e.target.value)}>
              {Object.keys(TYPE_STYLE).map(k => (
                <option key={k} value={k}>{TYPE_STYLE[k].label}</option>
              ))}
            </select>
          </F>

          <F label="Cost (total leg)">
            <CostInput costCny={t.cost_cny} onSave={v => u('cost_cny', v)} />
          </F>

          <F label="Status">
            <select defaultValue={t.status} onChange={e => u('status', e.target.value)}>
              <option value="BOOKED">✅ Booked</option>
              <option value="Not Booked">⏳ Not Booked</option>
            </select>
          </F>

          <F label="Notes / Booking Ref" style={{ gridColumn:'span 2' }}>
            <input defaultValue={t.notes} onBlur={e => u('notes', e.target.value)}
                      readOnly={!isAuthed} />
          </F>

          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button onClick={async () => {
              if (!confirm('Delete this leg?')) return
              await deleteTransport(t.id)
              toast.success('Leg deleted')
            }} style={{
              background:'transparent', border:'1.5px solid var(--red)',
              color:'var(--red)', borderRadius:8, padding:'6px 12px', fontSize:12,
            }}>🗑 Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────
export default function Transport() {
  const { theme, transports, addTransport, reorderTransports } = useStore()
  const booked = transports.filter(t => t.status==='BOOKED'||t.status==='✅ BOOKED').length

  const onDragEnd = (result) => {
    if (!result.destination) return
    if (result.destination.index === result.source.index) return
    const reordered = Array.from(transports)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    reorderTransports(reordered)
    toast.success(`Leg moved to position ${result.destination.index + 1}`)
  }

  return (
    <div style={{ padding:'24px 28px 48px', maxWidth:1300, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:30, fontWeight:900, color:'var(--ink)' }}>
            Transportation <span style={{ color:'var(--red)' }}>Log</span>
          </h1>
          <p style={{ fontSize:13, color:'var(--ink-soft)', marginTop:4 }}>
            {transports.length} legs · {booked} confirmed · Drag ⠿ to reorder · Click row to expand
          </p>
        </div>
        <button onClick={async () => {
          await addTransport()
          toast.success('Leg added — drag it to the right position')
        }} style={{
          background:'var(--red)', color:'white', border:'none',
          borderRadius:10, padding:'9px 18px', fontWeight:600, fontSize:13,
        }}>+ Add Leg</button>
      </div>

      {/* Column headers */}
      <div style={{
        display:'grid',
        gridTemplateColumns:'28px 32px 90px 110px 1fr 1fr 80px 80px 80px 100px 90px 90px',
        gap:8, padding:'0 14px 8px',
        fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em',
        color:'var(--ink-soft)', fontWeight:600,
        borderBottom:'2px solid var(--border)', marginBottom:8,
      }}>
        <span></span><span>#</span>
        <span>Date</span><span>Type</span><span>From</span><span>To</span>
        <span>Dep</span><span>Arr</span><span>Dur</span><span>Number</span>
        <span>Cost</span><span>Status</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="transports">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {transports.map((t, i) => (
                <Draggable key={t.id} draggableId={String(t.id)} index={i}>
                  {(provided, snapshot) => (
                    <TransportRow t={t} idx={i} provided={provided} snapshot={snapshot} />
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button onClick={async () => {
        await addTransport()
        toast.success('Leg added — drag it to the right position')
      }} style={{
        width:'100%', padding:14, border:'2px dashed var(--border)',
        background:'transparent', borderRadius:14, fontSize:14, color:'var(--ink-soft)',
        marginTop:8, cursor:'pointer',
      }}>＋ Add transport leg</button>
    </div>
  )
}
