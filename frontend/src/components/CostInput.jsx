import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

export default function CostInput({ costCny, onSave, style = {} }) {
  const { currency, exchangeRate, fmtInput, parseCost, isAuthed } = useStore()
  const isCAD = currency === 'CAD'

  const displayVal = fmtInput(costCny) || ''
  const [localVal, setLocalVal] = useState(String(displayVal))
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) setLocalVal(String(fmtInput(costCny) || ''))
  }, [currency, exchangeRate, costCny, focused])

  const handleBlur = () => {
    setFocused(false)
    if (!isAuthed) return
    const cny = parseCost(localVal)
    setLocalVal(String(fmtInput(cny) || ''))
    onSave(cny)
  }

  const numVal = parseFloat(localVal) || 0
  const hint = numVal > 0
    ? isCAD
      ? `≈ ¥${Math.round(numVal * exchangeRate).toLocaleString()}`
      : `≈ CA$${(numVal / exchangeRate).toFixed(0)}`
    : null

  return (
    <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:3 }}>
      <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
        <div style={{
          position:'absolute', left:8, top:'50%', transform:'translateY(-50%)',
          fontSize:11, fontWeight:700, color:'var(--gold)',
          fontFamily:'DM Mono,monospace', pointerEvents:'none', zIndex:1, userSelect:'none',
        }}>
          {isCAD ? 'CA$' : '¥'}
        </div>
        <input
          type="number"
          value={localVal}
          placeholder="0"
          readOnly={!isAuthed}
          onChange={e => isAuthed && setLocalVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          style={{
            paddingLeft: isCAD ? 36 : 22,
            paddingRight:8, textAlign:'right',
            fontFamily:'DM Mono,monospace',
            cursor: isAuthed ? 'text' : 'default',
            opacity: isAuthed ? 1 : 0.7,
            ...style,
          }}
        />
      </div>
      {hint && isAuthed && (
        <div style={{
          fontSize:10, color:'var(--ink-soft)', textAlign:'right',
          fontFamily:'DM Mono,monospace', letterSpacing:'0.03em',
        }}>{hint}</div>
      )}
    </div>
  )
}
