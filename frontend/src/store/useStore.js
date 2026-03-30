import { create } from 'zustand'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api'
const EDIT_PASSWORD = 'Jo@nn@312!'
const SESSION_KEY = 'chinatrip_authed'

export const useStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────
  days: [],
  hotels: [],
  transports: [],
  finance: [],
  summary: {},
  currency: 'CAD',
  exchangeRate: 5.03,
  theme: 'anna',
  loading: false,
  activeTab: 'dashboard',
  seeded: false,
  isAuthed: sessionStorage.getItem(SESSION_KEY) === 'true',

  // ── Auth ───────────────────────────────────────────────────
  login: (password) => {
    if (password === EDIT_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      set({ isAuthed: true })
      return true
    }
    return false
  },
  logout: () => {
    sessionStorage.removeItem(SESSION_KEY)
    set({ isAuthed: false })
  },

  // ── Actions ────────────────────────────────────────────────
  setTab: (tab) => set({ activeTab: tab }),
  setCurrency: (c) => set({ currency: c }),
  setTheme: (t) => set({ theme: t }),

  fmt: (cny) => {
    const { currency, exchangeRate } = get()
    if (!cny || cny === 0) return '—'
    if (currency === 'CNY') return '¥' + Number(cny).toLocaleString()
    return 'CA$' + (cny / exchangeRate).toFixed(0)
  },

  fmtInput: (cny) => {
    const { currency, exchangeRate } = get()
    if (!cny) return ''
    return currency === 'CNY' ? cny : +(cny / exchangeRate).toFixed(2)
  },

  parseCost: (val) => {
    const { currency, exchangeRate } = get()
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''))
    if (isNaN(n)) return 0
    return currency === 'CNY' ? n : +(n * exchangeRate).toFixed(2)
  },

  // ── Init / Seed ────────────────────────────────────────────
  init: async () => {
    set({ loading: true })
    try {
      await axios.post(`${API}/seed`)
      await get().fetchAll()
    } catch (e) {
      console.error('Init error:', e)
    }
    set({ loading: false })
  },

  fetchAll: async () => {
    const [days, hotels, transports, finance, summary] = await Promise.all([
      axios.get(`${API}/days`).then(r => r.data),
      axios.get(`${API}/hotels`).then(r => r.data),
      axios.get(`${API}/transports`).then(r => r.data),
      axios.get(`${API}/finance`).then(r => r.data),
      axios.get(`${API}/summary`).then(r => r.data),
    ])
    try {
      const rate = await axios.get(`${API}/settings/exchange_rate`).then(r => r.data)
      set({ exchangeRate: parseFloat(rate.value) })
    } catch {}
    set({ days, hotels, transports, finance, summary })
  },

  refreshSummary: async () => {
    const summary = await axios.get(`${API}/summary`).then(r => r.data)
    set({ summary })
  },

  // ── Days ───────────────────────────────────────────────────
  addDay: async () => {
    if (!get().isAuthed) return
    const days = get().days
    const newDay = {
      day_num: days.length + 1, date: 'New Date', city: 'New City',
      transport: '—', morning: '', afternoon: '', evening: '',
      food_morning: '', food_afternoon: '', food_evening: '',
      cost_cny: 0, joe_note: '', sort_order: days.length,
    }
    const res = await axios.post(`${API}/days`, newDay)
    set({ days: [...days, res.data] })
    return res.data.id
  },

  updateDay: async (id, field, value) => {
    if (!get().isAuthed) return
    const days = get().days.map(d => d.id === id ? { ...d, [field]: value } : d)
    set({ days })
    const day = days.find(d => d.id === id)
    await axios.put(`${API}/days/${id}`, day)
    if (field === 'cost_cny') get().refreshSummary()
  },

  deleteDay: async (id) => {
    if (!get().isAuthed) return
    await axios.delete(`${API}/days/${id}`)
    set({ days: get().days.filter(d => d.id !== id) })
  },

  reorderDays: async (newDays) => {
    if (!get().isAuthed) return
    set({ days: newDays })
    await axios.post(`${API}/days/reorder`, { ids: newDays.map(d => d.id) })
  },

  // ── Hotels ─────────────────────────────────────────────────
  addHotel: async () => {
    if (!get().isAuthed) return
    const newHotel = {
      city: 'New City', area: '', checkin: '', checkout: '',
      nights: 1, hotel_name: '', status: 'Not Booked',
      confirmation: '', notes: '', breakfast: false, cost_cny: 0,
    }
    const res = await axios.post(`${API}/hotels`, newHotel)
    set({ hotels: [...get().hotels, res.data] })
    return res.data.id
  },

  updateHotel: async (id, field, value) => {
    if (!get().isAuthed) return
    const hotels = get().hotels.map(h => h.id === id ? { ...h, [field]: value } : h)
    set({ hotels })
    const hotel = hotels.find(h => h.id === id)
    await axios.put(`${API}/hotels/${id}`, hotel)
    if (field === 'cost_cny') get().refreshSummary()
  },

  deleteHotel: async (id) => {
    if (!get().isAuthed) return
    await axios.delete(`${API}/hotels/${id}`)
    set({ hotels: get().hotels.filter(h => h.id !== id) })
  },

  // ── Transports ─────────────────────────────────────────────
  addTransport: async () => {
    if (!get().isAuthed) return
    const newT = {
      leg_num: get().transports.length + 1, date: '', type: 'Flight',
      from_city: '', to_city: '', dep_time: '', arr_time: '', duration: '',
      flight_num: '', cost_cny: 0, status: 'Not Booked', notes: '',
    }
    const res = await axios.post(`${API}/transports`, newT)
    set({ transports: [...get().transports, res.data] })
    return res.data.id
  },

  updateTransport: async (id, field, value) => {
    if (!get().isAuthed) return
    const transports = get().transports.map(t => t.id === id ? { ...t, [field]: value } : t)
    set({ transports })
    const t = transports.find(t => t.id === id)
    await axios.put(`${API}/transports/${id}`, t)
    if (field === 'cost_cny') get().refreshSummary()
  },

  deleteTransport: async (id) => {
    if (!get().isAuthed) return
    await axios.delete(`${API}/transports/${id}`)
    set({ transports: get().transports.filter(t => t.id !== id) })
  },

  reorderTransports: async (newT) => {
    if (!get().isAuthed) return
    set({ transports: newT })
    await axios.post(`${API}/transports/reorder`, { ids: newT.map(t => t.id) })
  },

  // ── Finance ────────────────────────────────────────────────
  updateFinanceItem: async (id, field, value) => {
    if (!get().isAuthed) return
    const finance = get().finance.map(f => f.id === id ? { ...f, [field]: value } : f)
    set({ finance })
    const item = finance.find(f => f.id === id)
    await axios.put(`${API}/finance/${id}`, item)
    get().refreshSummary()
  },

  addFinanceItem: async (category, icon) => {
    if (!get().isAuthed) return
    const newItem = { category, category_icon: icon, label: 'New item', cost_cny: 0, paid: false }
    const res = await axios.post(`${API}/finance`, newItem)
    set({ finance: [...get().finance, res.data] })
  },

  deleteFinanceItem: async (id) => {
    if (!get().isAuthed) return
    await axios.delete(`${API}/finance/${id}`)
    set({ finance: get().finance.filter(f => f.id !== id) })
    get().refreshSummary()
  },

  // ── Exchange rate ──────────────────────────────────────────
  updateExchangeRate: async (rate) => {
    if (!get().isAuthed) return
    const n = parseFloat(rate)
    if (isNaN(n) || n <= 0) return
    set({ exchangeRate: n })
    await axios.put(`${API}/settings/exchange_rate`, { value: n })
  },
}))
