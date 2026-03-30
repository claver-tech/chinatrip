import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

/**
 * CostInput — a cost field that:
 * - Shows the value converted to the active currency (CAD or CNY)
 * - Displays a badge showing which currency you're entering in
 * - On blur, converts to CNY and calls onSave(cny_value)
 * - Shows a small "= ¥X" or "= CA$X" conversion hint
 */
export default function CostInput({ costCny, onSave, style = {} }) {
  const { currency, exchangeRate, fmtInput, parseCost } = useStore()
  const isCAD = currency === 'CAD'

  // Display value in active currency
  const displayVal = fmtInput(costCny) || ''
  const [localVal, setLocalVal] = useState(String(displayVal))
  const [focused, setFocused] = useState(false)

  // Sync display when currency toggles or external value changes
  useEffect(() => {
    if (!focused) setLocalVal(String(fmtInput(costCny) || ''))
  }, [currency, exchangeRate, costCny, focused])

  const handleBlur = () => {
    setFocused(false)
    const cny = parseCost(localVal)
    setLocalVal(String(fmtInput(cny) || ''))
    onSave(cny)
  }

  // Conversion hint: if CAD → show ¥ equivalent; if CNY → show CA$ equivalent
  const numVal = parseFloat(localVal) || 0
  const hint = numVal > 0
    ? isCAD
      ? `≈ ¥${Math.round(numVal * exchangeRate).toLocaleString()}`
      : `≈ CA$${(numVal / exchangeRate).toFixed(0)}`
    : null

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Currency badge */}
        <div style={{
          position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
          fontSize: 11, fontWeight: 700, color: 'var(--gold)',
          fontFamily: 'DM Mono, monospace', pointerEvents: 'none', zIndex: 1,
          userSelect: 'none',
        }}>
          {isCAD ? 'CA$' : '¥'}
        </div>
        <input
          type="number"
          value={localVal}
          placeholder="0"
          onChange={e => setLocalVal(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={handleBlur}
          style={{
            paddingLeft: isCAD ? 36 : 22,
            paddingRight: 8,
            textAlign: 'right',
            fontFamily: 'DM Mono, monospace',
            ...style,
          }}
        />
      </div>
      {/* Conversion hint */}
      {hint && (
        <div style={{
          fontSize: 10, color: 'var(--ink-soft)', textAlign: 'right',
          fontFamily: 'DM Mono, monospace', letterSpacing: '0.03em',
        }}>
          {hint}
        </div>
      )}
    </div>
  )
}
