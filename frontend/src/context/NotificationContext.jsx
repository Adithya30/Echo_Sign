import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const NotificationContext = createContext()
export const useNotifications = () => useContext(NotificationContext)

export const NotificationProvider = ({ children }) => {
    const { user, token } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        if (!token || !user) return

        const wsUrl = `ws://127.0.0.1:8000/ws/notify/?token=${token}`
        const ws = new WebSocket(wsUrl)

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'send_notification') {
                const newNote = data.notification
                setNotifications(prev => [newNote, ...prev])
                setUnreadCount(prev => prev + 1)
                
                // Show toast for high priority
                if (newNote.notification_type === 'ALERT') {
                    toast.error(`🚨 ${newNote.title}: ${newNote.message}`, { duration: 6000 })
                } else {
                    toast.success(newNote.title)
                }
            }
        }

        return () => ws.close()
    }, [token, user])

    const markAsRead = (id) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
            {children}
        </NotificationContext.Provider>
    )
}
