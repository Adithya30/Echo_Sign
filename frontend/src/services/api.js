import axios from 'axios'

const API_BASE = 'http://127.0.0.1:8000/api'

const api = axios.create({
    baseURL: API_BASE,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' }
})

// Attach token dynamically to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// ── Translation ──────────────────────────────────────────────────────────────
export const translateGesture = (landmarks, sessionId = 'web-session', targetLang = 'en') =>
    api.post('/translate/', { landmarks, session_id: sessionId, target_lang: targetLang }).then(r => r.data)

export const speakText = (text, isEmergency = false) =>
    api.post('/speak/', { text, is_emergency: isEmergency }).then(r => r.data)

// ── History ──────────────────────────────────────────────────────────────────
export const getHistory = (params = {}) =>
    api.get('/history/', { params }).then(r => r.data)

export const deleteHistory = () =>
    api.delete('/history/').then(r => r.data)

export const deleteHistoryItem = (id) =>
    api.delete(`/history/${id}/`).then(r => r.data)

// ── Emergency ─────────────────────────────────────────────────────────────────
export const getEmergencyAlerts = () =>
    api.get('/emergency/').then(r => r.data)

export const triggerEmergency = (alertType, message, confidence = 1.0) =>
    api.post('/emergency/', { alert_type: alertType, message, confidence }).then(r => r.data)

export const acknowledgeAlert = (id) =>
    api.post(`/emergency/${id}/acknowledge/`).then(r => r.data)

// ── Contacts ──────────────────────────────────────────────────────────────────
export const getContacts = () =>
    api.get('/contacts/').then(r => r.data)

export const createContact = (data) =>
    api.post('/contacts/', data).then(r => r.data)

export const updateContact = (id, data) =>
    api.put(`/contacts/${id}/`, data).then(r => r.data)

export const deleteContact = (id) =>
    api.delete(`/contacts/${id}/`).then(r => r.data)

export const sendWhatsApp = (payload) =>
    api.post('/whatsapp/send/', payload).then(r => r.data)

// ── Stats ─────────────────────────────────────────────────────────────────────
export const getStats = () =>
    api.get('/stats/').then(r => r.data)

export const checkHealth = () =>
    api.get('/health/').then(r => r.data)

export default api
