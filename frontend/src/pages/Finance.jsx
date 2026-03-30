import CostInput from '../components/CostInput'
import { useStore } from '../store/useStore'
import toast from 'react-hot-toast'

const CAT_ICONS = {
  Flights:'✈️', Hotels:'🏨', Transport:'🚄', Food:'🍜',
  Attractions:'🎟️', Shopping:'🛍️', Misc:'📱'
}

function FinanceCat({ category, items }) {
  const { updateFinanceItem, deleteFinanceItem, addFinanceItem, fmt, theme } = useStore()
  const isJoe = theme === 'joe'
  const icon  = items[0]?.category_icon || CAT_ICONS[category] || '💰'
  const total = items.reduce((s,i) => s + (i.cost_cny||0), 0)

  return (
    <div style={{
      background:'var(--card-bg)', borderRadius:'var(--radius)', padding:20,
      boxShadow:'var(--shadow)',
      border: isJoe ? '1px solid rgba(255,255,255,0.07)' : 'none',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <div style={{ fontSize:14, fontWeight:600, display:'flex', alignItems:'center', gap:8, color:'var(--ink)' }}>
          {icon} {category}
        </div>
        <div style={{ fontFamily:'DM Mono,monospace', fontSize:15, color: isJoe ? '#4ade80' : 'var(--red)', fontWeight:500 }}>
          {fmt(total)}
        </div>
      </div>

      <div style={{ height:5, background:'var(--border)', borderRadius:3, marginBottom:14, overflow:'hidden' }}>
        <div style={{
          height:'100%',
          background: isJoe ? 'linear-gradient(90deg,#C0392B,#D4A843)' : 'var(--red)',
          borderRadius:3, width: total > 0 ? '100%' : '0%', transition:'width 0.5s',
        }}/>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {items.map(item => (
          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input defaultValue={item.label}
              onBlur={e => updateFinanceItem(item.id, 'label', e.target.value)}
              style={{ flex:1, fontSize:12, padding:'5px 8px' }} />
            <CostInput
              costCny={item.cost_cny}
              onSave={v => updateFinanceItem(item.id, 'cost_cny', v)}
              style={{ width:90, fontSize:12, padding:'5px 8px' }} />
            <select defaultValue={item.paid ? 'paid' : 'unpaid'}
              onChange={e => updateFinanceItem(item.id, 'paid', e.target.value === 'paid')}
              style={{ width:50, padding:'5px 4px', fontSize:11, textAlign:'center' }}>
              <option value="unpaid">⏳</option>
              <option value="paid">✅</option>
            </select>
            <button onClick={async () => {
              await deleteFinanceItem(item.id)
              toast.success('Item removed')
            }} style={{
              background:'transparent', border:'none', color:'var(--ink-soft)',
              fontSize:16, padding:'2px 4px', lineHeight:1, cursor:'pointer',
            }}>×</button>
          </div>
        ))}
      </div>

      <button onClick={() => addFinanceItem(category, icon)} style={{
        marginTop:10, width:'100%', padding:'6px 0',
        border: isJoe ? '1px dashed rgba(74,222,128,0.25)' : '1.5px dashed var(--border)',
        background:'transparent', borderRadius:8, fontSize:12, color:'var(--ink-soft)', cursor:'pointer',
      }}>+ Add item</button>
    </div>
  )
}

export default function Finance() {
  const { finance, summary, fmt, theme } = useStore()
  const isJoe = theme === 'joe'

  const grouped = finance.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = []
    acc[item.category].push(item)
    return acc
  }, {})

  const total     = summary.total_cost_cny || 0
  const paid      = summary.paid_cost_cny  || 0
  const remaining = total - paid

  return (
    <div style={{ padding:'24px 28px 48px', maxWidth:1200, margin:'0 auto' }}>
      <div style={{ marginBottom:24 }}>
        <h1 style={{ fontSize:30, fontWeight:900, color:'var(--ink)' }}>
          Trip <span style={{ color: isJoe ? '#4ade80' : 'var(--red)' }}>Finance</span>
        </h1>
        <p style={{ fontSize:13, color:'var(--ink-soft)', marginTop:4 }}>Enter costs in any currency · app converts to ¥ automatically · Toggle ✅ when paid</p>
      </div>

      {/* Summary banner */}
      <div style={{
        background: isJoe
          ? 'var(--card-bg)'
          : 'linear-gradient(135deg,var(--red-dark) 0%,var(--red) 60%,#e74c3c 100%)',
        border: isJoe ? '1px solid rgba(74,222,128,0.2)' : 'none',
        borderRadius:14, padding:28, marginBottom:28,
        display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20,
        color: isJoe ? 'var(--ink)' : 'white',
        position:'relative', overflow:'hidden',
      }}>
        {isJoe && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#4ade80,#D4A843,#C0392B)', opacity:0.6 }}/>}
        <div>
          <div style={{ fontSize:12, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--ink-soft)', marginBottom:6 }}>Estimated Total</div>
          <div style={{ fontFamily:'Playfair Display,serif', fontSize:42, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{fmt(total) || '—'}</div>
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:4 }}>2 people · Full trip</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:22, color: isJoe ? '#4ade80' : 'var(--gold)' }}>{fmt(paid) || '—'}</div>
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:4 }}>Paid & Confirmed</div>
        </div>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
          <div style={{ fontFamily:'DM Mono,monospace', fontSize:22, color:'var(--gold)' }}>{fmt(remaining) || '—'}</div>
          <div style={{ fontSize:12, color:'var(--ink-soft)', marginTop:4 }}>Still to Budget</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
        {Object.entries(grouped).map(([cat, items]) => (
          <FinanceCat key={cat} category={cat} items={items} />
        ))}
      </div>
    </div>
  )
}
