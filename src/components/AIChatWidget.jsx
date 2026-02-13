import { useState, useRef, useEffect } from 'react';
import { chatAPI } from '../services/api';
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Bot,
  User,
  Minimize2,
  Trash2,
} from 'lucide-react';

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '您好！我是 GTC-AI 智能客服。我可以帮您解答合规问题、平台使用问题，或协助您了解我们的服务。请问有什么可以帮您的？',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) { setHasUnread(false); setTimeout(() => inputRef.current?.focus(), 100); }
  }, [isOpen]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);
    try {
      const response = await chatAPI.sendMessage(trimmed, sessionId);
      setMessages((prev) => [...prev, { role: 'assistant', content: response.content || response.reply || response.message || '抱歉，暂时无法回复。' }]);
      if (response.session_id) setSessionId(response.session_id);
      if (!isOpen) setHasUnread(true);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: '网络异常，请稍后重试。如需帮助请发送邮件至 support@gtc-ai-global.com' }]);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleClear = () => {
    setMessages([{ role: 'assistant', content: '会话已清除。请问有什么可以帮您的？' }]);
    setSessionId(null);
  };

  const quickQuestions = [
    'UFLPA 合规要求有哪些？',
    '如何创建新案件？',
    '订阅套餐有什么区别？',
    'CBP 扣留该如何应对？',
  ];

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[520px] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gtc-navy border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gtc-gold/20 rounded-lg flex items-center justify-center">
                <Bot className="w-5 h-5 text-gtc-gold" />
              </div>
              <div>
                <p className="text-white text-sm font-medium">GTC-AI 智能客服</p>
                <p className="text-green-400 text-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" /> 在线
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={handleClear} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all" title="清除会话">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all">
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-100' : 'bg-amber-100'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-blue-600" /> : <Bot className="w-4 h-4 text-gtc-gold" />}
                </div>
                <div className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-gray-700 rounded-tl-sm border border-gray-200 shadow-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-gtc-gold" />
                </div>
                <div className="bg-white px-4 py-3 rounded-xl rounded-tl-sm border border-gray-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2 bg-gray-50">
              <p className="text-xs text-gray-400 mb-2">快速提问：</p>
              <div className="flex flex-wrap gap-1.5">
                {quickQuestions.map((q) => (
                  <button key={q} onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
                    className="px-2.5 py-1 text-xs bg-white text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gtc-navy transition-all border border-gray-200">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-1 border border-gray-200">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="输入您的问题..." className="flex-1 bg-transparent text-gtc-navy text-sm placeholder-gray-400 focus:outline-none py-2" disabled={sending} />
              <button onClick={handleSend} disabled={!input.trim() || sending}
                className="p-2 text-gtc-gold hover:bg-gtc-gold/10 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all z-50 ${
          isOpen ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gtc-gold hover:bg-yellow-600 hover:scale-105'
        }`}>
        {isOpen ? <X className="w-6 h-6 text-white" /> : (
          <>
            <MessageCircle className="w-6 h-6 text-gtc-navy" />
            {hasUnread && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />}
          </>
        )}
      </button>
    </>
  );
};

export default AIChatWidget;
