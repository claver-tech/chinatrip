import { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { useStore } from './store/useStore'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Itinerary from './pages/Itinerary'
import Stays from './pages/Stays'
import Transport from './pages/Transport'
import Finance from './pages/Finance'
import MapPage from './pages/MapPage'

export default function App() {
  const { init, activeTab, loading, theme } = useStore()
  const isJoe = theme === 'joe'

  useEffect(() => { init() }, [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  if (loading) return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'center',
      height:'100vh', flexDirection:'column', gap:16,
      background: isJoe ? '#1a1a1a' : '#f5f2ee',
    }}>
      <div style={{ fontSize:48 }}>🏮</div>
      <div style={{ fontFamily:'Playfair Display,serif', fontSize:22, color: isJoe ? '#4ade80' : '#C0392B' }}>
        Loading your trip…
      </div>
    </div>
  )

  return (
    <div data-theme={theme} style={{ height:'100vh', display:'flex', flexDirection:'column' }}>
      <Toaster position="bottom-right" toastOptions={{
        style: isJoe
          ? { background:'#2a2a2a', color:'#ececec', border:'1px solid rgba(74,222,128,0.2)', borderRadius:10, fontFamily:'DM Sans,sans-serif' }
          : { background:'#8B0000', color:'white', fontFamily:'DM Sans,sans-serif' },
        success: { iconTheme: { primary: isJoe ? '#4ade80' : '#D4A843', secondary: isJoe ? '#2a2a2a' : '#8B0000' } }
      }}/>
      <Nav />
      <main style={{ flex:1, overflow:'auto', paddingTop:'var(--nav-h)' }}>
        {activeTab === 'dashboard'  && <Dashboard />}
        {activeTab === 'itinerary'  && <Itinerary />}
        {activeTab === 'stays'      && <Stays />}
        {activeTab === 'transport'  && <Transport />}
        {activeTab === 'finance'    && <Finance />}
        {activeTab === 'map'        && <MapPage />}
      </main>
    </div>
  )
}
