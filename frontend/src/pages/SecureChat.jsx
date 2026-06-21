import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import AppLayout from '../components/AppLayout'
import { Send, Paperclip, CheckCheck, Shield, MoreVertical, Search } from 'lucide-react'

const conversations = [
  { id: 1, name: 'Finder #F2847', item: 'MacBook Pro 14"', lastMsg: 'Yes, it does have a blue sticker!', time: '2m ago', unread: 2, status: 'Active' },
  { id: 2, name: 'Student #S9341', item: 'Blue Hydroflask', lastMsg: 'When can I pick it up?', time: '1h ago', unread: 0, status: 'Active' },
  { id: 3, name: 'Finder #F1123', item: 'Student ID Card', lastMsg: 'Recovery complete ✓', time: '2d ago', unread: 0, status: 'Resolved' },
]

const messages = [
  { id: 1, from: 'them', text: 'Hi! I found a MacBook Pro near the library entrance. Is it yours?', time: '2:30 PM' },
  { id: 2, from: 'me', text: "Yes! I lost it this afternoon. It has a blue holographic sticker on the lid.", time: '2:32 PM' },
  { id: 3, from: 'them', text: 'Yes, it does have a blue sticker! Can you describe any other marks?', time: '2:33 PM' },
  { id: 4, from: 'me', text: 'There is a small scratch on the bottom left corner.', time: '2:34 PM' },
  { id: 5, from: 'them', text: "Perfect, that matches! I've submitted to the moderator. Let's arrange pickup through the campus office.", time: '2:35 PM' },
]

export default function SecureChat() {
  const [activeConv, setActiveConv] = useState(conversations[0])
  const [input, setInput] = useState('')
  const [msgs, setMsgs] = useState(messages)
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const sendMessage = () => {
    if (!input.trim()) return
    setMsgs(prev => [...prev, { id: Date.now(), from: 'me', text: input, time: 'Now' }])
    setInput('')
  }

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
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`w-full text-left p-4 hover:bg-secondary-50 transition-colors ${activeConv.id === conv.id ? 'bg-primary-50 border-l-2 border-primary' : ''}`}
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
              <button className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-500">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privacy notice */}
          <div className="mx-4 mt-3 bg-primary-50 rounded-xl p-2.5 text-center text-xs text-primary flex items-center justify-center gap-1.5">
            <Shield className="w-3.5 h-3.5" />
            Messages are end-to-end encrypted. Personal contact details are never shared.
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.map(msg => (
              <div key={msg.id} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm ${
                  msg.from === 'me'
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-secondary-100 text-secondary-900 rounded-bl-sm'
                }`}>
                  <p>{msg.text}</p>
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
            <button className="p-2 rounded-xl hover:bg-secondary-100 text-secondary-400 hover:text-secondary-600 transition-colors">
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
        </div>
      </div>
    </AppLayout>
  )
}
