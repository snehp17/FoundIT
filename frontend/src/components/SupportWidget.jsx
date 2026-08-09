import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Lightweight markdown -> JSX renderer (bold + numbered lists + newlines)
function formatMessage(text) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Convert **text** to <strong>
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    // Numbered list item
    if (/^\d+\.\s/.test(line)) {
      return <div key={i} className="mt-1 flex gap-1"><span className="font-semibold shrink-0">{line.match(/^\d+\./)}</span><span>{parts.map((p, j) => typeof p === 'string' ? p.replace(/^\d+\.\s/, '') : p)}</span></div>;
    }
    // Empty line = spacer
    if (!line.trim()) return <div key={i} className="h-1" />;
    return <div key={i}>{parts}</div>;
  });
}

export default function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! May we help you with anything on FoundIT today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const bottomRef = useRef();
  const navigate = useNavigate();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Send message history to our backend OpenAI route
      const response = await api.post('/support/ai', { messages: [...messages, userMsg].filter(m => m.role !== 'system') });
      
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.reply }]);
      
      // Show escalation option after first user interaction
      if (!showEscalate) setShowEscalate(true);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops, I am having trouble connecting to the server. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async () => {
    try {
      setLoading(true);
      // Fetch the assigned university admin for the student
      const res = await api.get('/support/escalate');
      const { adminId, adminName } = res.data;
      
      setIsOpen(false);
      // Redirect to secure chat with the admin and the special Support Session item
      navigate(`/chat?peerId=${adminId}&peerName=${encodeURIComponent(adminName)}&itemId=11111111-1111-1111-1111-111111111111&itemTitle=Support+Session`);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, we could not find an available admin for your university at this moment.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl flex items-center justify-center transition-colors duration-300 ${isOpen ? 'bg-secondary-900 text-white hover:bg-secondary-800' : 'bg-primary text-white hover:bg-primary-hover hover:scale-105'}`}
        onClick={() => setIsOpen(!isOpen)}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-secondary-200 overflow-hidden flex flex-col"
            style={{ maxHeight: '70vh' }}
          >
            {/* Header */}
            <div className="bg-secondary-900 text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">FoundIT Support</h3>
                <p className="text-xs text-secondary-300">AI Assistant</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary-50">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl max-w-[80%] text-sm ${
                    msg.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-sm' 
                      : 'bg-white border border-secondary-200 text-secondary-800 rounded-tl-sm'
                  }`}>
                    <div className="space-y-0.5 leading-snug">{formatMessage(msg.content)}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-2 justify-start">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center text-primary">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-secondary-200 text-secondary-500 rounded-tl-sm">
                    <span className="animate-pulse">Typing...</span>
                  </div>
                </div>
              )}
              {showEscalate && !loading && (
                <div className="flex justify-center pt-2">
                  <button onClick={handleEscalate} className="btn-sm bg-secondary-200 hover:bg-secondary-300 text-secondary-900 flex items-center gap-2 rounded-full px-4 text-xs font-medium">
                    Not resolved? Talk to University Admin <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-secondary-200 flex gap-2">
              <input
                type="text"
                placeholder="Ask a question..."
                className="flex-1 px-4 py-2 bg-secondary-50 border border-secondary-200 rounded-full focus:outline-none focus:border-primary text-sm"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
