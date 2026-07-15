import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { Send, Paperclip, CheckCheck, Shield, MoreVertical, Search } from 'lucide-react'
import api from '../api'

export default function SecureChat() {
  const currentUser = JSON.parse(localStorage.getItem('user')) || {}
  const [searchParams] = useSearchParams()
  const initialPeerId = searchParams.get('peerId')
  const initialItemId = searchParams.get('itemId')
  const initialPeerName = searchParams.get('peerName') || 'Match User'
  const initialItemTitle = searchParams.get('itemTitle') || 'Matched Item'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState([])
  const [menuOpen, setMenuOpen] = useState(false)
  const bottomRef = useRef()
  const fileInputRef = useRef()
  const activeConvRef = useRef(activeConv)

  useEffect(() => {
    activeConvRef.current = activeConv
  }, [activeConv])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get('/messages')
        const allMessages = res.data
      
      const convMap = new Map()
      
      allMessages.forEach(m => {
        const isSender = m.sender_id === currentUser.id
        const peerId = isSender ? m.receiver_id : m.sender_id
        const peerObj = isSender ? m.receiver : m.sender
        
        let peerName = 'Unknown User'
        if (peerObj) {
          if (Array.isArray(peerObj) && peerObj.length > 0) {
            peerName = peerObj[0].name || peerName
          } else if (peerObj.name) {
            peerName = peerObj.name
          }
        }
        
        const key = `${peerId}_${m.item_id}`
        
        if (!convMap.has(key)) {
          convMap.set(key, {
            id: key,
            peerId,
            itemId: m.item_id,
            name: peerName,
            item: m.item?.title || 'Item',
            msgs: [],
            lastMsg: '',
            time: '',
            unread: 0
          })
        } else {
          // If the conversation already exists, ensure the name is updated correctly
          const existingConv = convMap.get(key)
          if (existingConv.name === 'Match User' || existingConv.name === 'Unknown User' || existingConv.name === 'User') {
             if (peerName !== 'Unknown User') {
                 existingConv.name = peerName
             }
          }
        }
        
        const conv = convMap.get(key)
        const formattedMsg = {
          id: m.id,
          from: isSender ? 'me' : 'them',
          text: m.text,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
        
        conv.msgs.push(formattedMsg)
        conv.lastMsg = m.text
        conv.time = formattedMsg.time
      })

      let convList = Array.from(convMap.values())
      

        if (initialPeerId && initialItemId) {
          const initialKey = `${initialPeerId}_${initialItemId}`
          if (!convMap.has(initialKey)) {
             convList.unshift({
                id: initialKey,
                peerId: initialPeerId,
                itemId: initialItemId,
                name: initialPeerName,
                item: initialItemTitle,
                msgs: [],
                lastMsg: 'Start a conversation...',
                time: 'Now',
                unread: 0
             })
          }
        }
        
        setConversations(convList)
        
        const currentActive = activeConvRef.current
        let nextActive = null

        if (initialPeerId && initialItemId && !currentActive) {
          nextActive = convList.find(c => c.id === `${initialPeerId}_${initialItemId}`)
        } else if (currentActive) {
          nextActive = convList.find(c => c.id === currentActive.id)
        } else if (convList.length > 0) {
          nextActive = convList[0]
        }
        
        if (nextActive) {
          setActiveConv(nextActive)
          setMsgs(nextActive.msgs)
        }

      } catch (err) {
        console.error("Error fetching messages:", err)
        setError('Could not load conversations. Your session may have expired — please log in again.')
      } finally {
        setLoading(false)
      }
    }
    
    let intervalId;
    if (currentUser.id) {
        fetchMessages()
        intervalId = setInterval(fetchMessages, 3000)
    }
    return () => clearInterval(intervalId)
  }, [initialPeerId, initialItemId, currentUser.id])

  const handleConvClick = (conv) => {
    setActiveConv(conv)
    setMsgs(conv.msgs)
  }

  const sendMessage = async () => {
    if (!input.trim() || !activeConv) return
    const textToSend = input
    setInput('')
    
    try {
      const res = await api.post('/messages', {
        receiver_id: activeConv.peerId,
        item_id: activeConv.itemId,
        text: textToSend
      })
      
      const newMsgData = res.data.data
      const newMsg = {
        id: newMsgData.id,
        from: 'me',
        text: newMsgData.text,
        time: new Date(newMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      setMsgs(prev => [...prev, newMsg])
      setConversations(prev => prev.map(c => 
        c.id === activeConv.id ? { ...c, msgs: [...c.msgs, newMsg], lastMsg: newMsg.text, time: newMsg.time } : c
      ))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error("Error sending message:", err)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file || !activeConv) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await api.post('/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const fileUrl = res.data.url
      // send message with attachment
      const msgRes = await api.post('/messages', {
        receiver_id: activeConv.peerId,
        item_id: activeConv.itemId,
        text: `[ATTACHMENT]:${fileUrl}`
      })
      
      const newMsgData = msgRes.data.data
      const newMsg = {
        id: newMsgData.id,
        from: 'me',
        text: newMsgData.text,
        time: new Date(newMsgData.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      
      setMsgs(prev => [...prev, newMsg])
      setConversations(prev => prev.map(c => 
        c.id === activeConv.id ? { ...c, msgs: [...c.msgs, newMsg], lastMsg: 'Sent an attachment', time: newMsg.time } : c
      ))
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (err) {
      console.error("Error uploading file:", err)
      alert("Failed to upload file")
    }
  }

  if (loading) return <AppLayout title="Secure Chat"><div className="p-8 text-center">Loading chats...</div></AppLayout>

  return (
    <AppLayout title="Secure Chat">
      <div className="max-w-5xl mx-auto h-[calc(100vh-8rem)] flex gap-4">

        {/* Conversations List */}
        <div className="w-72 bg-surface rounded-3xl border border-secondary-100 shadow-md flex flex-col overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-secondary-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
              <input className="input-field pl-9 py-2 text-sm" placeholder="Search chats..." />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-secondary-100">
            {error ? (
              <div className="p-4 text-center text-sm text-red-500">{error}</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-sm text-secondary-400">No conversations yet</div>
            ) : conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => handleConvClick(conv)}
                className={`w-full text-left p-4 hover:bg-secondary-50 transition-colors ${activeConv?.id === conv.id ? 'bg-primary-50 border-l-2 border-primary' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {conv.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-secondary-900 text-sm truncate">{conv.name}</span>
                      <span className="text-xs text-secondary-400">{conv.time}</span>
                    </div>
                    <div className="text-xs text-secondary-500 truncate">{conv.item}</div>
                    <div className="text-xs text-secondary-400 truncate mt-0.5">{conv.lastMsg}</div>
                  </div>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 bg-surface rounded-3xl border border-secondary-100 shadow-md flex flex-col overflow-hidden">
          {activeConv ? (
          <>
          {/* Chat Header */}
          <div className="px-5 py-4 border-b border-secondary-100 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">
              {activeConv.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-secondary-900 text-sm">{activeConv.name}</div>
              <div className="text-xs text-secondary-400">Re: {activeConv.item} · Identity masked for privacy</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 badge-success text-xs py-1">
                <Shield className="w-3 h-3" />
                Encrypted
              </div>
              <div className="relative">
                <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-500">
                  <MoreVertical className="w-4 h-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white rounded-lg shadow-lg border border-secondary-100 py-1 z-50">
                    <button onClick={() => { alert('Block user action will be implemented in future version.'); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50">Block</button>
                    <button onClick={() => { setMsgs([]); setMenuOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Clear Chat</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="mx-4 mt-3 bg-primary-50 rounded-xl p-2.5 text-center text-xs text-primary flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Messages are end-to-end encrypted. Personal contact details are never shared.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 ? (
                <div className="text-center text-sm text-secondary-400 mt-10">Say hello! Your message will be encrypted.</div>
            ) : msgs.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === 'me'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-secondary-100 text-secondary-900 rounded-bl-sm'
                }`}>
                  {msg.text?.startsWith('[ATTACHMENT]:') ? (
                    <div className="mt-1">
                      {msg.text.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                        <img src={`http://localhost:5000${msg.text.split('[ATTACHMENT]:')[1]}`} alt="attachment" className="max-w-xs rounded-lg" />
                      ) : (
                        <a href={`http://localhost:5000${msg.text.split('[ATTACHMENT]:')[1]}`} target="_blank" rel="noopener noreferrer" className="underline font-medium">
                          View Attachment
                        </a>
                      )}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  <div className={`flex items-center gap-1 mt-1 text-xs ${msg.from === 'me' ? 'text-blue-200 justify-end' : 'text-secondary-400'}`}>
                    <span>{msg.time}</span>
                    {msg.from === 'me' && <CheckCheck className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-secondary-100 flex items-center gap-3">
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600 transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              type="text"
              placeholder="Type a message... (identity is masked)"
              className="flex-1 bg-secondary-50 border border-secondary-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary-100 transition-all"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={sendMessage}
              className={`p-2.5 rounded-xl transition-all ${input.trim() ? 'bg-primary text-white shadow-md' : 'bg-secondary-100 text-secondary-400'}`}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary-400">
                Select a conversation to start chatting
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
