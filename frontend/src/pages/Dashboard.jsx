import { useStore } from '../store/useStore'

const ROUTE = [
  {city:'Ottawa',date:'May 16'},{city:'Vancouver',date:'May 16'},
  {city:'Shanghai',date:'May 18'},{city:'Wanning',date:'May 24'},
  {city:'Sanya',date:'May 25'},{city:'Guangzhou',date:'May 27'},
  {city:'Chongqing',date:'May 29'},{city:'Wulong',date:'May 31'},
  {city:'Chengdu',date:'Jun 1'},{city:"Xi'an",date:'Jun 3'},
  {city:'Kaifeng',date:'Jun 6'},{city:'Beijing',date:'Jun 7'},
  {city:"Tai'an",date:'Jun 11'},{city:'Shanghai',date:'Jun 12'},
  {city:'Vancouver',date:'Jun 17'},{city:'Ottawa',date:'Jun 21'},
]

const TIPS = [
  {icon:'📱', text:'Install WeChat, Alipay, DiDi, Baidu Maps & a VPN before leaving Canada.'},
  {icon:'🛂', text:'Visa-free since Feb 17, 2026 — Canadians can enter China for up to 30 days.'},
  {icon:'💳', text:'Have CNY cash ready — many street vendors & local spots are cash only.'},
  {icon:'🎟️', text:'Book Forbidden City, Terracotta Warriors & Panda Base weeks ahead — they sell out.'},
  {icon:'🌡️', text:'May–June is 25–35°C and humid. Pack light, sunscreen SPF50, compact umbrella.'},
  {icon:'🚆', text:'Book HSR tickets via Trip.com. Beijing–Shanghai books out 2+ weeks ahead.'},
]

export default function Dashboard() {
  const { summary, fmt, setTab, days, hotels, transports, theme } = useStore()
  const isJoe = theme === 'joe'
  const totalCost = summary.total_cost_cny || 0
  const paidCost  = summary.paid_cost_cny  || 0

  const stats = [
    { num: summary.total_days || days.length,                  label:'Total Days',      accent: isJoe ? '#4ade80' : 'var(--red)' },
    { num: summary.total_cities || hotels.length,              label:'Cities',          accent: isJoe ? '#D4A843' : 'var(--red)' },
    { num: summary.total_transport_legs || transports.length,  label:'Transport Legs',  accent: isJoe ? '#e8614f' : 'var(--red)' },
    { num: summary.booked_transport_legs || 0,                 label:'Legs Booked',     accent: isJoe ? '#4ade80' : 'var(--red)' },
    { num: fmt(totalCost),                                     label:'Est. Total Cost', accent: isJoe ? '#D4A843' : 'var(--red)' },
    { num: fmt(paidCost),                                      label:'Paid / Booked',   accent: isJoe ? '#4ade80' : 'var(--red)' },
  ]

  const cardStyle = (accent, i) => isJoe ? {
    background:'var(--card-bg)', borderRadius:'var(--radius)', padding:'18px 16px',
    boxShadow:'var(--shadow)', textAlign:'center',
    borderTop:`2px solid ${accent}`,
    animation:`joe-pulse-${accent === '#4ade80' ? 'green' : 'gold'} 3s ease-in-out infinite`,
    animationDelay:`${i*0.35}s`,
  } : {
    background:'white', borderRadius:14, padding:'18px 16px',
    boxShadow:'var(--shadow)', textAlign:'center',
    borderTop:'3px solid var(--red)',
    animation:'anna-pulse 3s ease-in-out infinite',
    animationDelay:`${i*0.35}s`,
  }

  return (
    <div style={{ padding:'24px 28px 220px', maxWidth:1200, margin:'0 auto', position:'relative' }}>

      {/* ── Floating couple illustration ── */}
      <div style={{
        position:'fixed',
        bottom:0,
        right:32,
        width:220,
        height:280,
        zIndex:50,
        pointerEvents:'none',
        animation:'coupleFloat 5s ease-in-out infinite',
      }}>
        <style>{`
          @keyframes coupleFloat {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-14px); }
          }
        `}</style>
        <img
          src="/couple.png"
          alt="Joe & Joanna"
          style={{
            width:'100%',
            height:'100%',
            objectFit:'contain',
            objectPosition:'bottom center',
            mixBlendMode: isJoe ? 'screen' : 'multiply',
            filter:`drop-shadow(0 6px 20px rgba(192,57,43,0.3))`,
          }}
        />
      </div>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:34, fontWeight:900, color:'var(--ink)', lineHeight:1.1 }}>
            China & Canada <span style={{ color: isJoe ? '#4ade80' : 'var(--red)' }}>2026</span>
          </h1>
          <p style={{ color:'var(--ink-soft)', marginTop:4, fontSize:14 }}>May 16 – June 21 · Joanna · 37 days</p>
        </div>
        <button onClick={() => setTab('itinerary')} style={{
          background: isJoe ? 'rgba(74,222,128,0.1)' : 'var(--red)',
          color: isJoe ? '#4ade80' : 'white',
          border: isJoe ? '1px solid rgba(74,222,128,0.3)' : 'none',
          borderRadius:10, padding:'10px 20px', fontWeight:600, fontSize:13, cursor:'pointer',
          transition:'all 0.15s',
        }}>View Full Itinerary →</button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:14, marginBottom:28 }}>
        {stats.map((s,i) => (
          <div key={i} style={cardStyle(s.accent, i)}>
            <div style={{ fontFamily:'Playfair Display,serif', fontSize:32, fontWeight:900, color:s.accent, lineHeight:1 }}>{s.num}</div>
            <div style={{ fontSize:11, color:'var(--ink-soft)', marginTop:6, textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Route strip */}
      <div style={{
        background: isJoe ? 'var(--card-bg)' : 'var(--red-dark)',
        border: isJoe ? '1px solid rgba(74,222,128,0.15)' : 'none',
        borderRadius:14, padding:'16px 20px', marginBottom:28, overflowX:'auto',
        display:'flex', alignItems:'center', gap:0, position:'relative',
      }}>
        {isJoe && <div style={{ position:'absolute', top:0, left:0, right:0, height:1, background:'linear-gradient(90deg, rgba(74,222,128,0.6), rgba(212,168,67,0.4), transparent)', opacity:0.5 }}/>}
        {ROUTE.map((stop, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', minWidth:72 }}>
              <div style={{
                width:9, height:9, borderRadius:'50%',
                background: isJoe ? '#4ade80' : '#D4A843',
                marginBottom:6,
                animation: isJoe ? 'joe-pulse-green 2.5s ease-in-out infinite' : 'anna-pulse 2.5s ease-in-out infinite',
                animationDelay:`${i*0.1}s`,
              }}/>
              <div style={{ fontSize:10, fontWeight:600, color: isJoe ? '#ececec' : 'white', textAlign:'center', whiteSpace:'nowrap' }}>{stop.city}</div>
              <div style={{ fontSize:9, color: isJoe ? '#4ade80' : '#D4A843', marginTop:2 }}>{stop.date}</div>
            </div>
            {i < ROUTE.length-1 && (
              <div style={{ flex:1, minWidth:16, height:1.5, background: isJoe ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.2)', marginBottom:20, position:'relative' }}>
                <span style={{ position:'absolute', right:-5, top:-9, color: isJoe ? 'rgba(74,222,128,0.5)' : '#D4A843', fontSize:12 }}>›</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tips */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
        {TIPS.map((t,i) => (
          <div key={i} style={{
            background:'var(--card-bg)', borderRadius:14, padding:'14px 18px',
            boxShadow:'var(--shadow)', display:'flex', gap:12, alignItems:'flex-start',
            borderLeft: isJoe ? '3px solid rgba(74,222,128,0.4)' : '3px solid var(--gold)',
          }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{t.icon}</span>
            <p style={{ fontSize:13, lineHeight:1.5, color:'var(--ink-soft)' }}>{t.text}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
