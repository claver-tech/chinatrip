import { useState } from 'react'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

export default function LoginModal({ onClose }) {
  const { login, theme } = useStore()
  const isJoe = theme === 'joe'
  const [pw, setPw] = useState('')
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (login(pw)) {
      toast.success('Edit mode unlocked')
      onClose()
    } else {
      setError(true)
      setPw('')
      setTimeout(() => setError(false), 2000)
    }
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:200,
      background:'rgba(0,0,0,0.6)',
      display:'flex', alignItems:'center', justifyContent:'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background:'var(--card-bg)', borderRadius:16, padding:'32px 28px',
        width:320, boxShadow:'0 24px 60px rgba(0,0,0,0.4)',
        border: isJoe ? '1px solid rgba(74,222,128,0.2)' : '1px solid var(--border)',
      }}>
        <div style={{ textAlign:'center', marginBottom:20 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔒</div>
          <h2 style={{ fontSize:20, fontWeight:700, color:'var(--ink)', fontFamily:'Playfair Display,serif' }}>
            Unlock Editing
          </h2>
          <p style={{ fontSize:13, color:'var(--ink-soft)', marginTop:6 }}>
            Enter your password to make changes
          </p>
        </div>

        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="Password"
          autoFocus
          style={{
            width:'100%', padding:'10px 14px', fontSize:15,
            borderRadius:10, marginBottom:12,
            border: error ? '2px solid var(--red)' : '1.5px solid var(--border)',
            background:'var(--mist)', color:'var(--ink)',
            outline:'none', transition:'border 0.15s',
          }}
        />

        {error && (
          <p style={{ fontSize:12, color:'var(--red)', textAlign:'center', marginBottom:10 }}>
            Incorrect password
          </p>
        )}

        <button onClick={handleSubmit} style={{
          width:'100%', padding:'11px 0',
          background: isJoe ? '#4ade80' : 'var(--red)',
          color: isJoe ? '#1a1a1a' : 'white',
          border:'none', borderRadius:10,
          fontWeight:600, fontSize:14, cursor:'pointer',
        }}>
          Unlock
        </button>

        <button onClick={onClose} style={{
          width:'100%', padding:'8px 0', marginTop:8,
          background:'transparent', border:'none',
          color:'var(--ink-soft)', fontSize:13, cursor:'pointer',
        }}>
          Cancel — view only
        </button>
      </div>
    </div>
  )
}
