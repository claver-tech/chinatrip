import CostInput from '../components/CostInput'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

function HotelCard({ hotel }) {
  const { theme, updateHotel, deleteHotel, fmt, isAuthed } = useStore()
  const booked = hotel.status === 'BOOKED' || hotel.status === '✅ BOOKED'
  const u = (f, v) => updateHotel(hotel.id, f, v)

  return (
    <div style={{
      background:'var(--card-bg)', borderRadius:14,
      boxShadow:'var(--shadow)', overflow:'hidden',
      borderTop:`4px solid ${booked ? 'var(--booked)' : 'var(--gold)'}`,
      transition:'box-shadow 0.2s',
    }}>
      {/* Card top */}
      <div style={{ padding:'14px 18px', background: theme==='joe' ? 'var(--card-alt)' : 'linear-gradient(135deg,#f9f6f1,#ede8df)', display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom: theme==='joe' ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
        <div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:17, fontWeight:700, color:'var(--ink)' }}>{hotel.city}</div>
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:2 }}>{hotel.checkin} → {hotel.checkout}</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5 }}>
          <span style={{
            background:'var(--red)', color:'white', borderRadius:20,
            padding:'2px 10px', fontSize:12, fontWeight:600
          }}>{hotel.nights} night{hotel.nights !== 1 ? 's' : ''}</span>
          {booked && <span style={{ fontSize:10, color:'var(--booked)', fontWeight:600 }}>✅ CONFIRMED</span>}
        </div>
      </div>

      <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:12 }}>
        <Row label="Check-in">
          <input defaultValue={hotel.checkin} onBlur={e => u('checkin', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>
        <Row label="Check-out">
          <input defaultValue={hotel.checkout} onBlur={e => u('checkout', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>
        <Row label="Nights">
          <input type="number" defaultValue={hotel.nights} onBlur={e => u('nights', parseInt(e.target.value)||1)} />
        </Row>
        <Row label="Hotel Name / Options">
          <textarea defaultValue={hotel.hotel_name} onBlur={e => u('hotel_name', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>
        <Row label="Area / Neighbourhood">
          <input defaultValue={hotel.area} onBlur={e => u('area', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>
        <Row label="Cost (total stay)">
          <CostInput costCny={hotel.cost_cny} onSave={v => u('cost_cny', v)} />
        </Row>
        <Row label="Confirmation #">
          <input defaultValue={hotel.confirmation} onBlur={e => u('confirmation', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>

        {/* Status + Breakfast */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <select defaultValue={hotel.status}
            onChange={e => u('status', e.target.value)}
            style={{
              width:'auto', padding:'7px 12px',
              background: booked ? 'var(--booked-bg)' : 'var(--gold-light)',
              border:`1.5px solid ${booked ? 'var(--booked)' : 'var(--gold)'}`,
              color: booked ? 'var(--booked)' : '#7D6608',
              fontWeight:600, borderRadius:8
            }}>
            <option value="BOOKED">✅ Booked</option>
            <option value="Not Booked">⏳ Not Booked</option>
            <option value="Cancelled">❌ Cancelled</option>
          </select>

          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13 }}>
            <span>🍳 Breakfast</span>
            <div style={{ position:'relative', width:38, height:21 }}>
              <input type="checkbox" defaultChecked={hotel.breakfast}
                onChange={e => u('breakfast', e.target.checked)}
                style={{ opacity:0, width:0, height:0, position:'absolute' }} id={`bf-${hotel.id}`} />
              <label htmlFor={`bf-${hotel.id}`} style={{
                position:'absolute', inset:0, borderRadius:10, cursor:'pointer',
                background: hotel.breakfast ? 'var(--booked)' : 'var(--border)',
                transition:'background 0.2s'
              }}>
                <span style={{
                  position:'absolute', top:2, left: hotel.breakfast ? 19 : 2,
                  width:17, height:17, borderRadius:'50%', background:'var(--card-bg)',
                  transition:'left 0.2s', boxShadow:'0 1px 4px rgba(0,0,0,0.2)'
                }}/>
              </label>
            </div>
            <span style={{ fontSize:11, color: hotel.breakfast ? 'var(--booked)' : 'var(--ink-soft)' }}>
              {hotel.breakfast ? 'Included' : 'Not included'}
            </span>
          </label>
        </div>

        <Row label="Notes">
          <input defaultValue={hotel.notes} onBlur={e => u('notes', e.target.value)}
                      readOnly={!isAuthed} />
        </Row>

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button onClick={async () => {
            if (!confirm('Remove this stay?')) return
            await deleteHotel(hotel.id)
            toast.success('Stay removed')
          }} style={{
            background:'transparent', border:'1.5px solid var(--red)',
            color:'var(--red)', borderRadius:8, padding:'5px 12px', fontSize:12
          }}>🗑 Remove</button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, children }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <span style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', fontWeight:600 }}>{label}</span>
      {children}
    </label>
  )
}

export default function Stays() {
  const { theme, hotels, addHotel } = useStore()

  const handleAdd = async () => {
    await addHotel()
    toast.success('Stay added')
  }

  const totalNights = hotels.reduce((s,h) => s + (h.nights||0), 0)

  return (
    <div style={{ padding:'24px 28px 48px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:30, fontWeight:900, color:'var(--ink)' }}>Hotel <span style={{ color:'var(--red)' }}>& Stays</span></h1>
          <p style={{ fontSize:13, color:'var(--ink-soft)', marginTop:4 }}>
            {hotels.length} stops · {totalNights} total nights ·&nbsp;
            {hotels.filter(h => h.status==='BOOKED'||h.status==='✅ BOOKED').length} confirmed
          </p>
        </div>
        <button onClick={handleAdd} style={{
          background:'var(--red)', color:'white', border:'none',
          borderRadius:10, padding:'9px 18px', fontWeight:600, fontSize:13
        }}>+ Add Stay</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(310px,1fr))', gap:18 }}>
        {hotels.map(h => <HotelCard key={h.id} hotel={h} />)}
        <button onClick={handleAdd} style={{
          display:'flex', alignItems:'center', justifyContent:'center',
          gap:8, padding:20, border:'2px dashed var(--border)',
          background:'transparent', borderRadius:14, fontSize:14,
          color:'var(--ink-soft)', cursor:'pointer'
        }}>＋ Add New Stay</button>
      </div>
    </div>
  )
}
