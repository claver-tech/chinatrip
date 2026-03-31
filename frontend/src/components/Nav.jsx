import { useState } from 'react'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'
import LoginModal from './LoginModal'

const TABS = [
  { id:'dashboard', label:'🏮 Dashboard' },
  { id:'itinerary', label:'📅 Itinerary' },
  { id:'stays',     label:'🏨 Stays' },
  { id:'transport', label:'🚄 Transport' },
  { id:'finance',   label:'💰 Finance' },
  { id:'map',       label:'🗺️ Map' },
]

export default function Nav() {
  const { activeTab, setTab, currency, setCurrency, exchangeRate, updateExchangeRate, theme, setTheme, isAuthed, logout } = useStore()
  const isJoe = theme === 'joe'
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)

  const handleRateUpdate = async () => {
    const r = prompt(`Current rate: 1 CAD = ${exchangeRate} CNY\nEnter new rate:`)
    if (r) { await updateExchangeRate(r); toast.success(`Rate updated: 1 CAD = ${r} CNY`) }
  }

  const handleTab = (id) => { setTab(id); setMenuOpen(false) }

  const navBg      = isJoe ? '#212121' : '#8B0000'
  const activeClr  = isJoe ? '#4ade80' : '#8B0000'
  const activeBg   = isJoe ? 'rgba(74,222,128,0.12)' : '#D4A843'
  const activeBdr  = isJoe ? '1px solid rgba(74,222,128,0.35)' : 'none'
  const inactiveClr = isJoe ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.75)'

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        height:'var(--nav-h)', background: navBg,
        display:'flex', alignItems:'center', padding:'0 16px', gap:6,
        boxShadow: isJoe ? 'none' : '0 2px 20px rgba(0,0,0,0.3)',
        borderBottom: isJoe ? '1px solid rgba(74,222,128,0.18)' : 'none',
      }}>
        {/* Logo */}
        <div style={{ marginRight:10, flexShrink:0 }}>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:16, fontWeight:700, color:'#D4A843', lineHeight:1.1 }}>中国 2026</div>
          <div style={{ fontSize:9, color: isJoe ? 'rgba(74,222,128,0.55)' : 'rgba(255,255,255,0.6)', letterSpacing:'0.06em' }}>
            {isJoe ? 'JOANNA · TRIP PLANNER' : 'Joanna · Trip Planner'}
          </div>
        </div>

        {/* Desktop tabs */}
        <div className="desktop-tabs" style={{ display:'flex', gap:3, flex:1, overflowX:'auto' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTab(t.id)} style={{
              padding:'6px 12px', borderRadius:8,
              border: activeTab===t.id ? activeBdr : '1px solid transparent',
              background: activeTab===t.id ? activeBg : 'transparent',
              color: activeTab===t.id ? activeClr : inactiveClr,
              fontWeight: activeTab===t.id ? 600 : 400,
              fontSize:12, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.15s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Rate */}
        <button className="nav-rate nav-hide-sm" onClick={handleRateUpdate} style={{
          background: isJoe ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
          border: isJoe ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius:6, color: isJoe ? 'rgba(236,236,236,0.55)' : 'rgba(255,255,255,0.7)',
          fontSize:11, padding:'4px 8px', cursor:'pointer', flexShrink:0,
        }}>1 CAD = {exchangeRate} ¥</button>

        {/* Currency */}
        <div style={{
          display:'flex', flexShrink:0,
          background: isJoe ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)',
          border: isJoe ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius:20, padding:3,
        }}>
          {['CAD','CNY'].map(c => (
            <button key={c} onClick={() => setCurrency(c)} style={{
              padding:'4px 10px', borderRadius:16, border:'none', fontSize:11, fontWeight:500,
              background: currency===c ? (isJoe ? '#4ade80' : '#D4A843') : 'transparent',
              color: currency===c ? (isJoe ? '#1a1a1a' : '#8B0000') : (isJoe ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.65)'),
              cursor:'pointer', transition:'all 0.15s',
            }}>{c}</button>
          ))}
        </div>

        {/* Theme toggle */}
        <button onClick={() => setTheme(isJoe ? 'anna' : 'joe')} style={{
          display:'flex', alignItems:'center', gap:5, flexShrink:0,
          background: isJoe ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.1)',
          border: isJoe ? '1px solid rgba(255,255,255,0.1)' : 'none',
          borderRadius:20, padding:'4px 10px', cursor:'pointer', fontSize:11,
        }}>
          <span style={{ color: !isJoe ? '#D4A843' : 'rgba(255,255,255,0.3)', fontWeight: !isJoe ? 600 : 400 }}>A</span>
          <div style={{
            width:28, height:16, borderRadius:8, margin:'0 2px',
            background: isJoe ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.2)',
            border: isJoe ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.3)',
            position:'relative',
          }}>
            <div style={{
              position:'absolute', top:1.5,
              left: isJoe ? 'calc(100% - 14px)' : '1.5px',
              width:11, height:11, borderRadius:'50%',
              background: isJoe ? '#4ade80' : '#D4A843',
              transition:'left 0.25s ease',
            }}/>
          </div>
          <span style={{ color: isJoe ? '#4ade80' : 'rgba(255,255,255,0.3)', fontWeight: isJoe ? 600 : 400 }}>J</span>
        </button>

        {/* Auth button */}
        <button onClick={() => isAuthed ? logout() : setShowLogin(true)}
          title={isAuthed ? 'Click to lock editing' : 'Click to unlock editing'}
          style={{
            display:'flex', alignItems:'center', gap:4, flexShrink:0,
            background: isAuthed
              ? (isJoe ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.12)')
              : 'rgba(255,255,255,0.08)',
            border: isAuthed
              ? (isJoe ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(255,255,255,0.25)')
              : '1px solid rgba(255,255,255,0.2)',
            borderRadius:20, padding:'4px 10px', cursor:'pointer', fontSize:13,
            color: isAuthed ? (isJoe ? '#4ade80' : '#D4A843') : 'rgba(255,255,255,0.8)',
            whiteSpace:'nowrap',
        }}>
          {isAuthed ? '✏️' : '🔒'}
        </button>

        {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}

        {/* Hamburger — mobile only */}
        <button onClick={() => setMenuOpen(o => !o)} style={{
          display:'none', flexShrink:0,
          background:'transparent', border:'none',
          color: isJoe ? '#4ade80' : '#D4A843',
          fontSize:22, cursor:'pointer', padding:'4px',
          lineHeight:1,
        }} className="hamburger">☰</button>
      </nav>

      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div style={{
          position:'fixed', top:'var(--nav-h)', left:0, right:0, zIndex:99,
          background: isJoe ? '#212121' : '#8B0000',
          borderBottom: isJoe ? '1px solid rgba(74,222,128,0.2)' : '1px solid rgba(255,255,255,0.1)',
          padding:'8px 0',
          boxShadow:'0 8px 24px rgba(0,0,0,0.3)',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => handleTab(t.id)} style={{
              display:'block', width:'100%', textAlign:'left',
              padding:'12px 20px', border:'none',
              background: activeTab===t.id ? (isJoe ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.1)') : 'transparent',
              color: activeTab===t.id ? (isJoe ? '#4ade80' : '#D4A843') : (isJoe ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.85)'),
              fontSize:15, fontWeight: activeTab===t.id ? 600 : 400, cursor:'pointer',
              borderLeft: activeTab===t.id ? `3px solid ${isJoe ? '#4ade80' : '#D4A843'}` : '3px solid transparent',
            }}>{t.label}</button>
          ))}
          <div style={{ padding:'10px 20px', borderTop: isJoe ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.15)', marginTop:4, display:'flex', gap:8, alignItems:'center' }}>
            <button onClick={handleRateUpdate} style={{
              background:'rgba(255,255,255,0.1)', border:'none', borderRadius:6,
              color:'rgba(255,255,255,0.7)', fontSize:12, padding:'6px 10px', cursor:'pointer',
            }}>1 CAD = {exchangeRate} ¥</button>
            <div style={{ display:'flex', background:'rgba(255,255,255,0.1)', borderRadius:16, padding:2 }}>
              {['CAD','CNY'].map(c => (
                <button key={c} onClick={() => setCurrency(c)} style={{
                  padding:'5px 12px', borderRadius:14, border:'none', fontSize:12,
                  background: currency===c ? '#D4A843' : 'transparent',
                  color: currency===c ? '#8B0000' : 'rgba(255,255,255,0.7)',
                  cursor:'pointer',
                }}>{c}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close menu */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)} style={{
          position:'fixed', inset:0, zIndex:98, background:'transparent',
        }}/>
      )}

      {/* Mobile-only CSS */}
      <style>{`
        @media (max-width: 900px) {
          .nav-hide-sm { display: none !important; }
        }
        @media (max-width: 768px) {
          .desktop-tabs { display: none !important; }
          .nav-rate { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </>
  )
}
