import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Shield, Maximize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        "🛡️ **Hệ thống giám sát Vigilance trực tuyến.**\n\nChào bạn, tôi là trợ lý AI. Tôi đã sẵn sàng truy vấn dữ liệu từ **16 camera** và **3,211 bản ghi** bạo lực hiện có. Bạn cần báo cáo về khu vực nào?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:5002/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query }),
      });

      if (!response.ok) throw new Error(`Lỗi (${response.status})`);

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.answer || '⚠️ Không tìm thấy dữ liệu liên quan.',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: '❌ **Lỗi kết nối:** Không thể liên lạc với máy chủ Chatbot.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#0f172a] border-l border-slate-800 overflow-hidden">

      {/* ================= HEADER ================= */}
      <div className="px-6 py-3 border-b border-slate-700/50 bg-slate-800/40 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xs font-black tracking-widest text-white uppercase">
              Vigilance Intelligence Terminal
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold uppercase mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              RAG Engine Active
            </span>
          </div>
        </div>

        <Maximize2 className="w-4 h-4 text-slate-500 cursor-pointer hover:text-white transition-colors" />
      </div>

      {/* ================= CHAT CONTENT ================= */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,1)_0%,rgba(2,6,23,1)_100%)]">
        <div className="max-w-[1200px] mx-auto px-8 py-8 space-y-8">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start gap-6 ${
                message.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  message.role === 'user'
                    ? 'bg-blue-600 border-blue-400/30'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-emerald-400" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`flex flex-col ${
                  message.role === 'user'
                    ? 'items-end max-w-[70%]'
                    : 'items-start max-w-[75%]'
                }`}
              >
                <div
                  className={`px-6 py-4 rounded-3xl text-[14.5px] leading-7 shadow-xl ${
                    message.role === 'user'
                      ? 'bg-blue-600/90 text-white rounded-tr-none shadow-blue-900/20'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/50 rounded-tl-none shadow-black/40'
                  }`}
                >
                  <div className="prose prose-invert prose-emerald max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        strong: ({ children }) => {
                          const t = String(children).toLowerCase();
                          if (t.includes('bạo lực') || t.includes('violence'))
                            return (
                              <span className="text-red-400 font-black bg-red-500/10 px-1 rounded">
                                {children}
                              </span>
                            );
                          return (
                            <span className="text-white font-bold">
                              {children}
                            </span>
                          );
                        },
                        ul: ({ children }) => (
                          <ul className="list-disc ml-6 space-y-2 my-3">
                            {children}
                          </ul>
                        ),
                        li: ({ children }) => (
                          <li className="text-slate-300">{children}</li>
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Loading */}
          {isLoading && (
            <div className="flex items-start gap-6">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center animate-pulse">
                <Bot className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="px-6 py-4 rounded-3xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* ================= INPUT ================= */}
      <div className="bg-slate-900/80 border-t border-slate-800/50 backdrop-blur-xl">
        <form
          onSubmit={handleSendMessage}
          className="max-w-[1200px] mx-auto px-8 py-6 flex items-center gap-4"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Truy vấn dữ liệu từ hệ thống giám sát..."
            className="flex-1 bg-[#020617] border border-slate-700/50 text-slate-200 text-sm rounded-2xl py-4 px-6 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 placeholder:text-slate-600"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-emerald-900/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
