import { useEffect, useRef, useState, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import { useStore } from '../store/useStore'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const LEG_COLORS  = { Flight:'#C0392B', HSR:'#2980B9', Bus:'#27AE60', Transfer:'#D4A843' }
const TYPE_EMOJI  = { Flight:'✈️', HSR:'🚄', Bus:'🚌', Transfer:'🚗' }
const TYPE_LABEL  = { Flight:'Flight', HSR:'HSR Train', Bus:'Bus', Transfer:'Transfer' }

function arcPoints(from, to, steps = 24) {
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    pts.push([
      from[0] + (to[0] - from[0]) * t,
      from[1] + (to[1] - from[1]) * t + Math.sin(t * Math.PI) * 8 * 0.4,
    ])
  }
  return pts
}

export default function MapPage() {
  const mapContainer = useRef(null)
  const mapRef       = useRef(null)
  const layersReady  = useRef(false)
  const activeRef    = useRef(null)
  const sidebarRef   = useRef(null)

  const { transports, hotels } = useStore()
  const [activeId, setActiveId] = useState(null)

  // Only include legs that have real coordinates stored
  const legs = transports
    .map((t, idx) => ({ ...t, idx }))
    .filter(l => l.from_lat && l.from_lng && l.to_lat && l.to_lng)

  // Legs missing coords — shown in sidebar with a warning
  const missingCoords = transports
    .map((t, idx) => ({ ...t, idx }))
    .filter(l => !l.from_lat || !l.from_lng || !l.to_lat || !l.to_lng)

  const highlightLeg = useCallback((id) => {
    if (!mapRef.current || !layersReady.current) return
    const map = mapRef.current

    if (activeRef.current !== null) {
      const prev = legs.find(l => l.id === activeRef.current)
      if (prev) {
        const booked = prev.status === 'BOOKED' || prev.status === '✅ BOOKED'
        try {
          map.setPaintProperty(`leg-${prev.id}-vis`, 'line-width', 2.5)
          map.setPaintProperty(`leg-${prev.id}-vis`, 'line-opacity', booked ? 1 : 0.65)
          map.setPaintProperty(`leg-${prev.id}-vis`, 'line-color', LEG_COLORS[prev.type] || '#999')
        } catch {}
      }
    }

    activeRef.current = id
    setActiveId(id)
    if (id === null) return

    const leg = legs.find(l => l.id === id)
    if (!leg) return

    try {
      map.setPaintProperty(`leg-${leg.id}-vis`, 'line-width', 7)
      map.setPaintProperty(`leg-${leg.id}-vis`, 'line-opacity', 1)
      map.setPaintProperty(`leg-${leg.id}-vis`, 'line-color', '#FFD700')
    } catch {}

    const from = [leg.from_lng, leg.from_lat]
    const to   = [leg.to_lng,   leg.to_lat]
    const dist = Math.sqrt(Math.pow(to[0]-from[0],2) + Math.pow(to[1]-from[1],2))
    const zoom = dist > 60 ? 2.8 : dist > 20 ? 4 : dist > 5 ? 6 : 8
    map.flyTo({ center:[(from[0]+to[0])/2,(from[1]+to[1])/2], zoom, duration:900, essential:true })
  }, [legs])

  useEffect(() => {
    if (activeId === null || !sidebarRef.current) return
    const el = sidebarRef.current.querySelector(`[data-leg-id="${activeId}"]`)
    if (el) el.scrollIntoView({ behavior:'smooth', block:'nearest' })
  }, [activeId])

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [105, 32], zoom: 3.5,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right')

    map.on('load', () => {
      // Draw legs using stored coordinates
      legs.forEach((leg) => {
        const from   = [leg.from_lng, leg.from_lat]
        const to     = [leg.to_lng,   leg.to_lat]
        const color  = LEG_COLORS[leg.type] || '#999'
        const booked = leg.status === 'BOOKED' || leg.status === '✅ BOOKED'
        const coords = leg.type === 'Flight' ? arcPoints(from, to) : [from, to]
        const layerId = `leg-${leg.id}`

        map.addSource(layerId, {
          type:'geojson',
          data:{ type:'Feature', geometry:{ type:'LineString', coordinates:coords }, properties:{} }
        })
        map.addLayer({ id:`${layerId}-hit`, type:'line', source:layerId,
          paint:{ 'line-width':14, 'line-opacity':0 }
        })
        map.addLayer({ id:`${layerId}-vis`, type:'line', source:layerId,
          paint:{
            'line-color': color, 'line-width': 2.5,
            'line-opacity': booked ? 1 : 0.65,
            'line-dasharray': leg.type==='Flight' ? [4,3] : leg.type==='Bus' ? [3,2] : [1],
          }
        })

        map.on('mouseenter', `${layerId}-hit`, () => {
          map.getCanvas().style.cursor = 'pointer'
          if (activeRef.current !== leg.id) {
            map.setPaintProperty(`${layerId}-vis`, 'line-width', 5)
            map.setPaintProperty(`${layerId}-vis`, 'line-opacity', 1)
          }
        })
        map.on('mouseleave', `${layerId}-hit`, () => {
          map.getCanvas().style.cursor = ''
          if (activeRef.current !== leg.id) {
            map.setPaintProperty(`${layerId}-vis`, 'line-width', 2.5)
            map.setPaintProperty(`${layerId}-vis`, 'line-opacity', booked ? 1 : 0.65)
          }
        })
        map.on('click', `${layerId}-hit`, (e) => {
          highlightLeg(leg.id)
          new mapboxgl.Popup({ maxWidth:'260px' })
            .setLngLat(e.lngLat)
            .setHTML(`
              <div style="font-family:'DM Sans',sans-serif">
                <div style="font-size:13px;font-weight:700;color:#D4A843;margin-bottom:6px">
                  Leg ${leg.idx+1} — ${TYPE_EMOJI[leg.type]||''} ${leg.type}
                </div>
                <div style="font-size:12px;margin-bottom:3px">📍 ${leg.from_city}</div>
                <div style="font-size:12px;margin-bottom:3px;padding-left:12px">↓ → ${leg.to_city}</div>
                <div style="font-size:12px;margin-bottom:3px">🗓️ ${leg.date}</div>
                ${leg.flight_num ? `<div style="font-size:12px;margin-bottom:3px">🔖 ${leg.flight_num}</div>` : ''}
                ${leg.dep_time ? `<div style="font-size:12px;margin-bottom:3px">⏰ ${leg.dep_time} → ${leg.arr_time} (${leg.duration})</div>` : ''}
                <div style="font-size:12px;margin-top:6px;padding:4px 8px;border-radius:6px;
                  background:${booked?'rgba(30,132,73,0.3)':'rgba(255,255,255,0.1)'}">
                  ${booked ? '✅ Confirmed' : '⏳ Not booked yet'}
                </div>
              </div>`)
            .addTo(map)
        })
      })

      // City markers — derived from leg endpoints
      const cityPoints = new Map()
      legs.forEach((leg, i) => {
        const fromKey = `${leg.from_lat},${leg.from_lng}`
        const toKey   = `${leg.to_lat},${leg.to_lng}`
        if (!cityPoints.has(fromKey)) cityPoints.set(fromKey, { name: leg.from_city.split(',')[0], lat: leg.from_lat, lng: leg.from_lng, first: i === 0 && !cityPoints.size })
        if (!cityPoints.has(toKey))   cityPoints.set(toKey,   { name: leg.to_city.split(',')[0],   lat: leg.to_lat,   lng: leg.to_lng,   last: i === legs.length - 1 })
      })

      cityPoints.forEach((city, key) => {
        const hotel = hotels.find(h => {
          const hCity = h.city.toLowerCase().split('(')[0].trim()
          const cName = city.name.toLowerCase()
          return cName.includes(hCity.split(' ')[0]) || hCity.includes(cName.split(' ')[0])
        })
        const color = city.first ? '#27AE60' : city.last ? '#8E44AD' : '#C0392B'
        const size  = city.first || city.last ? 16 : 13

        const el = document.createElement('div')
        el.style.cssText = `width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;`

        const popupHtml = `
          <div style="font-family:'DM Sans',sans-serif">
            <div style="font-size:14px;font-weight:700;color:#D4A843;margin-bottom:6px">${city.name}</div>
            ${hotel ? `
              <div style="font-size:12px;margin-bottom:3px">🏨 ${hotel.hotel_name.split('|')[0].trim()}</div>
              <div style="font-size:12px;margin-bottom:3px">📅 ${hotel.checkin} → ${hotel.checkout} (${hotel.nights} nights)</div>
              <div style="font-size:12px;padding:3px 8px;border-radius:6px;margin-top:6px;
                background:${(hotel.status==='BOOKED'||hotel.status==='✅ BOOKED')?'rgba(30,132,73,0.3)':'rgba(255,255,255,0.1)'}">
                ${(hotel.status==='BOOKED'||hotel.status==='✅ BOOKED') ? '✅ Hotel confirmed' : '⏳ Hotel not booked'}
              </div>` :
              '<div style="font-size:12px;opacity:0.7">Transit stop</div>'
            }
          </div>`

        new mapboxgl.Marker({ element: el })
          .setLngLat([city.lng, city.lat])
          .setPopup(new mapboxgl.Popup({ offset:12, maxWidth:'240px' }).setHTML(popupHtml))
          .addTo(map)

        const labelEl = document.createElement('div')
        labelEl.innerHTML = city.name
        labelEl.style.cssText = `font-family:'DM Sans',sans-serif;font-size:11px;font-weight:600;color:#1a1a1a;white-space:nowrap;text-shadow:0 0 3px white,0 0 3px white,0 0 3px white;pointer-events:none;margin-left:${size/2+4}px;margin-top:-6px`
        new mapboxgl.Marker({ element: labelEl }).setLngLat([city.lng, city.lat]).addTo(map)
      })

      layersReady.current = true
    })

    return () => { map.remove(); mapRef.current = null; layersReady.current = false }
  }, [transports, hotels])

  const flyTo = (center, zoom) => mapRef.current?.flyTo({ center, zoom, duration:1400, essential:true })

  return (
    <div style={{ display:'flex', height:'calc(100vh - var(--nav-h))', overflow:'hidden' }}>

      {/* ── Sidebar ── */}
      <div ref={sidebarRef} style={{
        width:280, flexShrink:0,
        background:'var(--card-bg)', borderRight:'1px solid var(--border)',
        overflowY:'auto', display:'flex', flexDirection:'column',
      }}>
        <div style={{
          padding:'14px 16px 10px', borderBottom:'1px solid var(--border)',
          position:'sticky', top:0, background:'var(--card-bg)', zIndex:2,
        }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:15, fontWeight:700, color:'var(--ink)' }}>Route Legs</div>
          <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:2 }}>Hover or click to highlight on map</div>
        </div>

        {/* Legs with coords */}
        {transports.map((t, idx) => {
          const hasCoords = t.from_lat && t.from_lng && t.to_lat && t.to_lng
          const booked    = t.status === 'BOOKED' || t.status === '✅ BOOKED'
          const color     = LEG_COLORS[t.type] || '#999'
          const isActive  = activeId === t.id
          const layerId   = `leg-${t.id}`

          return (
            <div
              key={t.id}
              data-leg-id={t.id}
              onClick={() => hasCoords && highlightLeg(isActive ? null : t.id)}
              onMouseEnter={() => {
                if (!hasCoords || !mapRef.current || !layersReady.current || activeRef.current === t.id) return
                mapRef.current.setPaintProperty(`${layerId}-vis`, 'line-width', 5)
                mapRef.current.setPaintProperty(`${layerId}-vis`, 'line-opacity', 1)
              }}
              onMouseLeave={() => {
                if (!hasCoords || !mapRef.current || !layersReady.current || activeRef.current === t.id) return
                mapRef.current.setPaintProperty(`${layerId}-vis`, 'line-width', 2.5)
                mapRef.current.setPaintProperty(`${layerId}-vis`, 'line-opacity', booked ? 1 : 0.65)
              }}
              style={{
                padding:'10px 14px', borderBottom:'1px solid var(--border)',
                cursor: hasCoords ? 'pointer' : 'default',
                background: isActive ? 'rgba(212,168,67,0.12)' : !hasCoords ? 'var(--card-alt)' : 'var(--card-bg)',
                borderLeft:`3px solid ${isActive ? '#FFD700' : hasCoords ? color : '#ddd'}`,
                transition:'background 0.15s',
              }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                <span style={{
                  fontFamily:'DM Mono,monospace', fontSize:10, fontWeight:700,
                  color:'white', background: hasCoords ? color : '#bbb',
                  padding:'1px 6px', borderRadius:10,
                }}>{idx+1}</span>
                <span style={{ fontSize:12, fontWeight:600, color: isActive ? 'var(--gold)' : hasCoords ? 'var(--ink)' : 'var(--ink-soft)' }}>
                  {TYPE_EMOJI[t.type]} {TYPE_LABEL[t.type]||t.type}
                </span>
                {booked && <span style={{ marginLeft:'auto', fontSize:10, color:'var(--booked)', fontWeight:600 }}>✅</span>}
                {!hasCoords && (
                  <span title="No coordinates — search location in Transport tab to fix" style={{
                    marginLeft:'auto', fontSize:10, color:'var(--gold)',
                    background:'rgba(212,168,67,0.15)', padding:'1px 6px', borderRadius:8, cursor:'help',
                  }}>📍?</span>
                )}
              </div>
              <div style={{ fontSize:11, color:'var(--ink-soft)', lineHeight:1.4 }}>
                {t.from_city.split(',')[0].trim()}
                <span style={{ color: hasCoords ? color : '#bbb', margin:'0 4px' }}>→</span>
                {t.to_city.split(',')[0].trim()}
              </div>
              <div style={{ display:'flex', gap:8, marginTop:3 }}>
                <span style={{ fontSize:10, color:'var(--ink-soft)' }}>🗓 {t.date}</span>
                {t.flight_num && t.flight_num !== 'Various' && (
                  <span style={{ fontSize:10, color:'var(--ink-soft)', fontFamily:'DM Mono,monospace' }}>{t.flight_num}</span>
                )}
              </div>
              {!hasCoords && (
                <div style={{ fontSize:10, color:'var(--gold)', opacity:0.7, marginTop:4, fontStyle:'italic' }}>
                  Open Transport tab → search location to add to map
                </div>
              )}
            </div>
          )
        })}

        {/* Legend */}
        <div style={{ padding:'14px 16px', marginTop:'auto', borderTop:'1px solid var(--border)', background:'var(--card-bg)' }}>
          <div style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--ink-soft)', marginBottom:8 }}>Legend</div>
          {[['✈️ Flight','#C0392B'],['🚄 HSR','#2980B9'],['🚌 Bus','#27AE60'],['🚗 Transfer','#D4A843']].map(([l,c]) => (
            <div key={l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, marginBottom:5 }}>
              <div style={{ width:20, height:3, background:c, borderRadius:2, flexShrink:0 }}/>
              <span>{l}</span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:11, color:'var(--ink-soft)', fontStyle:'italic', lineHeight:1.6 }}>
            📍? = missing coords<br/>Search location in Transport tab
          </div>
        </div>
      </div>

      {/* ── Map ── */}
      <div style={{ flex:1, position:'relative' }}>
        <div style={{
          position:'absolute', zIndex:10, top:12, left:'50%',
          transform:'translateX(-50%)',
          display:'flex', gap:6, background:'white', borderRadius:12,
          padding:'6px 10px', boxShadow:'var(--shadow-lg)',
        }}>
          {[
            { label:'🌏 Full Route', c:[105,32],     z:3.5 },
            { label:'🇨🇳 China',     c:[110,32],     z:4.5 },
            { label:'🏙️ Beijing',    c:[116.4,39.9], z:10  },
            { label:'🌃 Shanghai',   c:[121.5,31.2], z:11  },
            { label:'🐼 Chengdu',    c:[104.1,30.6], z:11  },
            { label:'🇨🇦 Canada',    c:[-100,55],    z:4   },
          ].map(b => (
            <button key={b.label} onClick={() => flyTo(b.c, b.z)} style={{
              padding:'4px 10px', borderRadius:8, border:'1.5px solid var(--border)',
              background:'white', fontSize:11, fontWeight:500, color:'var(--ink)',
              cursor:'pointer', whiteSpace:'nowrap',
            }}>{b.label}</button>
          ))}
        </div>

        {/* Active leg info bar */}
        {activeId !== null && (() => {
          const leg = transports.find(l => l.id === activeId)
          if (!leg) return null
          const booked = leg.status === 'BOOKED' || leg.status === '✅ BOOKED'
          const idx = transports.findIndex(l => l.id === activeId)
          return (
            <div style={{
              position:'absolute', zIndex:10, bottom:16, left:'50%',
              transform:'translateX(-50%)',
              background:'var(--red-dark)', color:'white',
              borderRadius:12, padding:'10px 18px',
              boxShadow:'var(--shadow-lg)', display:'flex', alignItems:'center', gap:14,
              fontSize:13, whiteSpace:'nowrap',
            }}>
              <span style={{ color:'var(--gold)', fontWeight:700 }}>Leg {idx+1}</span>
              <span>{TYPE_EMOJI[leg.type]} {leg.from_city.split(',')[0].trim()} → {leg.to_city.split(',')[0].trim()}</span>
              <span style={{ opacity:0.75 }}>{leg.date}</span>
              {leg.flight_num && leg.flight_num !== 'Various' && (
                <span style={{ fontFamily:'DM Mono,monospace', opacity:0.75 }}>{leg.flight_num}</span>
              )}
              <span style={{ color: booked ? '#5dade2' : '#f0b27a' }}>{booked ? '✅ Confirmed' : '⏳ Pending'}</span>
              <button onClick={() => highlightLeg(null)} style={{
                background:'rgba(255,255,255,0.15)', border:'none', color:'white',
                borderRadius:6, padding:'2px 8px', cursor:'pointer', fontSize:12,
              }}>✕</button>
            </div>
          )
        })()}

        <div ref={mapContainer} style={{ width:'100%', height:'100%' }} />
      </div>
    </div>
  )
}
