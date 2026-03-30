import CostInput from '../components/CostInput'
import { useState, useCallback } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

const PHASE_CONFIG = [
  { key:'morning',   food:'food_morning',   label:'Morning',   emoji:'☀️', lightBg:'#FFF8E7', lightColor:'#B7701A', darkBg:'rgba(212,168,67,0.1)', darkColor:'#D4A843' },
  { key:'afternoon', food:'food_afternoon', label:'Afternoon', emoji:'🌤️', lightBg:'#EBF5FB', lightColor:'#1A5276', darkBg:'rgba(74,222,128,0.08)', darkColor:'#4ade80' },
  { key:'evening',   food:'food_evening',   label:'Evening',   emoji:'🌙', lightBg:'#F5EEF8', lightColor:'#5B2C8D', darkBg:'rgba(232,97,79,0.1)', darkColor:'#e8614f' },
]

function DayCard({ day, index }) {
  const [open, setOpen] = useState(false)
  const { theme, updateDay, deleteDay, fmt, isAuthed } = useStore()
  const isJoe = theme === 'joe'

  const update = useCallback((field, val) => updateDay(day.id, field, val), [day.id])

  const handleDelete = async () => {
    if (!confirm('Delete this day?')) return
    await deleteDay(day.id)
    toast.success('Day deleted')
  }

  return (
    <Draggable draggableId={String(day.id)} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps}
          style={{
            background:'var(--card-bg)', borderRadius:14, marginBottom:12,
            boxShadow: snapshot.isDragging ? 'var(--shadow-lg)' : 'var(--shadow)',
            overflow:'hidden', opacity: snapshot.isDragging ? 0.92 : 1,
            ...provided.draggableProps.style
          }}>

          {/* Header */}
          <div style={{
            display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
            background: isJoe
              ? 'linear-gradient(135deg,#1f2937 0%,#252d3d 100%)'
              : 'linear-gradient(135deg,var(--red-dark) 0%,var(--red) 100%)',
            borderLeft: isJoe ? '3px solid #4ade80' : 'none',
            cursor:'pointer'
          }} onClick={() => setOpen(o => !o)}>

            {/* Drag handle */}
            <div {...provided.dragHandleProps} style={{ color:'rgba(255,255,255,0.4)', fontSize:18, cursor:'grab' }}>⠿</div>

            <div style={{
              fontFamily:'Playfair Display,serif', fontSize:26, fontWeight:900,
              color: isJoe ? '#4ade80' : 'var(--gold)', minWidth:40, textAlign:'center', lineHeight:1
            }}>{day.day_num}</div>

            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, color: isJoe ? 'rgba(74,222,128,0.6)' : 'rgba(255,255,255,0.65)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{day.date}</div>
              <div style={{ fontSize:16, fontWeight:600, color:'white', marginTop:2 }}>{day.city}</div>
            </div>

            {day.transport && day.transport !== '—' && (
              <div style={{
                fontSize:11, padding:'3px 10px', borderRadius:12,
                background:'rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.9)',
                maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'
              }}>{day.transport}</div>
            )}

            {day.cost_cny > 0 && (
              <div style={{ fontSize:12, color:'var(--gold)', fontWeight:600, whiteSpace:'nowrap' }}>
                {fmt(day.cost_cny)}
              </div>
            )}

            <div style={{ color:'rgba(255,255,255,0.6)', fontSize:16, transition:'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none' }}>▾</div>
          </div>

          {/* Body */}
          {open && (
            <div style={{ padding:20 }}>
              {/* Meta row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:18 }}>
                {[
                  { label:'Date', field:'date' },
                  { label:'City / Destination', field:'city' },
                  { label:'Transport', field:'transport' },
                ].map(({ label, field }) => (
                  <label key={field} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                    <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:600 }}>{label}</span>
                    <input defaultValue={day[field]} onBlur={e => update(field, e.target.value)}
                      readOnly={!isAuthed} />
                  </label>
                ))}
                <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:600 }}>Day Cost</span>
                  <CostInput costCny={day.cost_cny} onSave={v => update('cost_cny', v)} />
                </label>
              </div>

              {/* 3 phases */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginBottom:16 }}>
                {PHASE_CONFIG.map(ph => (
                  <div key={ph.key} style={{ borderRadius:10, border:'1.5px solid var(--border)', overflow:'hidden' }}>
                    <div style={{ padding:'7px 12px', background: isJoe ? ph.darkBg : ph.lightBg, color: isJoe ? ph.darkColor : ph.lightColor, fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
                      {ph.emoji} {ph.label}
                    </div>
                    <div style={{ padding:12, display:'flex', flexDirection:'column', gap:10 }}>
                      <label style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:500 }}>Activities</span>
                        <textarea defaultValue={day[ph.key]} onBlur={e => update(ph.key, e.target.value)}
                      readOnly={!isAuthed} />
                      </label>
                      <label style={{ display:'flex', flexDirection:'column', gap:3 }}>
                        <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:500 }}>Food</span>
                        <textarea style={{ minHeight:44 }} defaultValue={day[ph.food]} onBlur={e => update(ph.food, e.target.value)} />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Joe's note */}
              <label style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
                <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:600 }}>🎯 Joe's Wishlist Notes</span>
                <input defaultValue={day.joe_note} placeholder="Personal must-do items..."
                  onBlur={e => update('joe_note', e.target.value)}
                  style={{ border:'1.5px solid var(--gold)', background:'var(--gold-light)', color:'var(--ink)' }} />
              </label>

              <div style={{ display:'flex', justifyContent:'flex-end' }}>
                <button onClick={handleDelete} style={{
                  background:'transparent', border:'1.5px solid var(--red)',
                  color:'var(--red)', borderRadius:8, padding:'6px 14px', fontSize:12, fontWeight:500
                }}>🗑 Delete Day</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}

export default function Itinerary() {
  const { theme, days, reorderDays, addDay, isAuthed } = useStore()
  const [filter, setFilter] = useState('all')

  const cities = [...new Set(days.map(d => d.city.split('→')[0].trim()))]

  const filtered = filter === 'all' ? days : days.filter(d => d.city.includes(filter))

  const onDragEnd = (result) => {
    if (!result.destination) return
    const reordered = Array.from(days)
    const [moved] = reordered.splice(result.source.index, 1)
    reordered.splice(result.destination.index, 0, moved)
    reorderDays(reordered)
  }

  const handleAdd = async () => {
    await addDay()
    toast.success('Day added')
  }

  return (
    <div style={{ padding:'24px 28px 48px', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:30, fontWeight:900, color:'var(--ink)' }}>Day-by-Day <span style={{ color: theme==='joe' ? '#4ade80' : 'var(--red)' }}>Itinerary</span></h1>
          <p style={{ fontSize:13, color:'var(--ink-soft)', marginTop:4 }}>Drag to reorder · Click to expand · All fields editable</p>
        </div>
        <button onClick={handleAdd} style={{
          background: theme==='joe' ? 'rgba(74,222,128,0.12)' : 'var(--red)',
          color: theme==='joe' ? '#4ade80' : 'white',
          border: theme==='joe' ? '1px solid rgba(74,222,128,0.3)' : 'none',
          borderRadius:10, padding:'9px 18px', fontWeight:600, fontSize:13, cursor:'pointer',
        }}style={{ display: isAuthed ? undefined : 'none' }}>+ Add Day</button>
      </div>

      {/* City filter */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:18 }}>
        {['all', ...cities].map(c => (
          <button key={c} onClick={() => setFilter(c)} style={{
            padding:'5px 14px', borderRadius:20,
            border:`1.5px solid ${filter===c ? 'var(--red)' : 'var(--border)'}`,
            background: filter===c ? 'var(--red)' : 'var(--card-bg)',
            color: filter===c ? 'white' : 'var(--ink)',
            fontSize:12, fontWeight:500
          }}>{c === 'all' ? 'All Cities' : c}</button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="days">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {filtered.map((day, i) => <DayCard key={day.id} day={day} index={i} />)}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <button onClick={handleAdd} style={{
        width:'100%', padding:14, border:'2px dashed var(--border)',
        background:'transparent', borderRadius:14, fontSize:14, color:'var(--ink-soft)',
        marginTop:8, transition:'all 0.15s', cursor:'pointer'
      }}>＋ Add a new day</button>
    </div>
  )
}
