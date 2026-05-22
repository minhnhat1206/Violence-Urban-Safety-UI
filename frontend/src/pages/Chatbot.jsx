import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Clock, Database, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// ── Constants ──────────────────────────────────────────────────────────────
const CHATBOT_ENDPOINT = '/api/chat';

const SUGGESTED_QUERIES = [
  '15 phút qua có bao nhiêu alert bạo lực?',          // HOT — Fluss realtime
  'Hôm nay camera nào ghi nhận nhiều sự cố nhất?',    // WARM — Paimon camera_stats
  'Camera nào nguy hiểm nhất trong 7 ngày qua?',      // WARM — Paimon camera_stats
  'Tháng trước tổng cộng có bao nhiêu vụ bạo lực?',  // COLD — Iceberg historical
  'Cho tôi xem hình ảnh bằng chứng gần đây',          // Evidence — MinIO frames
];

// ── Layer badge config ─────────────────────────────────────────────────────
const LAYER_CONFIG = {
  Fluss:   { label: 'HOT · Fluss',   color: 'bg-red-500/20 text-red-400 border-red-500/30',    icon: Zap },
  Paimon:  { label: 'WARM · Paimon', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Database },
  Iceberg: { label: 'COLD · Iceberg',color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',  icon: Database },
  hot:     { label: 'HOT · Fluss',   color: 'bg-red-500/20 text-red-400 border-red-500/30',    icon: Zap },
  warm:    { label: 'WARM · Paimon', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: Database },
  cold:    { label: 'COLD · Iceberg',color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',  icon: Database },
};

// ── LayerBadge ─────────────────────────────────────────────────────────────
const LayerBadge = ({ layer }) => {
  const cfg = LAYER_CONFIG[layer];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-mono ${cfg.color}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
};

// ── Citations ──────────────────────────────────────────────────────────────
const Citations = ({ citations }) => {
  const [showSql, setShowSql] = React.useState(false);
  if (!citations) return null;

  const { sql_used, rows_returned, ...rest } = citations;
  const items = Object.entries(rest).filter(([, v]) => v != null && v !== '');
  if (items.length === 0 && !sql_used) return null;

  return (
    <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-500 space-y-0.5">
      {items.map(([k, v]) => (
        <div key={k} className="flex gap-1">
          <span className="text-slate-600">{k.replace(/_/g, ' ')}:</span>
          <span>{String(v)}</span>
        </div>
      ))}
      {rows_returned != null && (
        <div className="flex gap-1">
          <span className="text-slate-600">rows returned:</span>
          <span>{rows_returned}</span>
        </div>
      )}
      {sql_used && (
        <div className="mt-1">
          <button
            onClick={() => setShowSql(s => !s)}
            className="text-slate-600 hover:text-emerald-400 transition-colors underline underline-offset-2"
          >
            {showSql ? '▲ ẩn SQL' : '▼ xem SQL đã dùng'}
          </button>
          {showSql && (
            <pre className="mt-1 bg-slate-900 border border-slate-700 rounded p-2 text-emerald-300 text-xs overflow-x-auto whitespace-pre-wrap break-all">
              {sql_used}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

// ── Main Chatbot Component ─────────────────────────────────────────────────
const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: 'Xin chào! Tôi là **Vigilance AI** — trợ lý phân tích dữ liệu an ninh thông minh.\n\nTôi có thể truy vấn 3 lớp dữ liệu Streamhouse:\n- 🔴 **HOT (Fluss)** — dữ liệu real-time < 1 giờ\n- 🟡 **WARM (Paimon)** — dữ liệu 1 giờ – 7 ngày\n- 🔵 **COLD (Iceberg)** — lịch sử > 7 ngày\n\nBạn muốn hỏi gì về hệ thống?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null); // 'ok' | 'error' | null
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  // Health check on mount
  useEffect(() => {
    fetch('/health')
      .then(r => r.json())
      .then(d => setHealthStatus(d.status === 'ok' ? 'ok' : 'error'))
      .catch(() => setHealthStatus('error'));
  }, []);

  const sendQuery = async (query) => {
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Optimistic "thinking" message
    const thinkingId = Date.now();
    setMessages(prev => [
      ...prev,
      { role: 'model', content: null, isThinking: true, id: thinkingId },
    ]);

    const controller = new AbortController();
    // Paimon queries can take up to 5 min; hard limit 10 min
    const timeoutId = setTimeout(() => controller.abort(), 10 * 60 * 1000);

    try {
      // Build history from current messages (exclude thinking/error states)
      const historyPayload = messages
        .filter(m => !m.isThinking && !m.isError && m.content)
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));

      const response = await fetch(CHATBOT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ query, history: historyPayload }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }

      const data = await response.json();
      const botMessage = {
        role: 'model',
        content: data.answer || 'Không có câu trả lời.',
        layer: data.layer,
        citations: data.citations,
        duration_ms: data.duration_ms,
        confidence: data.confidence,
        frame_urls: data.frame_urls || [],
      };

      setMessages(prev => prev.filter(m => m.id !== thinkingId).concat(botMessage));
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err?.name === 'AbortError';
      const msg = isAbort
        ? 'Request timeout (10 phút). Chatbot có thể đang quá tải.'
        : (err?.message || 'Lỗi không xác định');
      setMessages(prev =>
        prev.filter(m => m.id !== thinkingId).concat({
          role: 'model',
          content: `⚠️ Lỗi kết nối chatbot: ${msg}\n\nHãy kiểm tra service chatbot đang chạy tại port 5002.`,
          isError: true,
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendQuery(input);
  };

  const handleSuggestion = (q) => {
    if (!isLoading) sendQuery(q);
  };

  const [expandedImg, setExpandedImg] = useState(null);

  const renderMarkdown = (text) => (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        strong: ({ node, ...props }) => <strong {...props} className="font-bold text-white" />,
        ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 space-y-1" />,
        li: ({ node, ...props }) => <li {...props} className="text-slate-300" />,
        code: ({ node, ...props }) => (
          <code {...props} className="bg-slate-700/60 px-1 rounded text-emerald-300 text-xs" />
        ),
        h3: ({ node, ...props }) => <h3 {...props} className="text-base font-bold text-white mt-2 mb-3" />,
        img: ({ node, src, alt, ...props }) => (
          <div className="my-3">
            <div
              className="relative rounded-lg overflow-hidden border border-slate-600 cursor-pointer group max-w-sm"
              onClick={() => setExpandedImg({ src, alt })}
            >
              <img
                src={src}
                alt={alt || 'Evidence'}
                className="w-full object-cover max-h-48 group-hover:opacity-90 transition-opacity"
                onError={(e) => {
                  e.target.parentElement.innerHTML =
                    '<div class="bg-slate-800 text-slate-500 text-xs p-4 text-center">⚠ Ảnh không khả dụng</div>';
                }}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                <span className="text-white text-xs opacity-0 group-hover:opacity-100 bg-black/60 px-2 py-1 rounded">
                  🔍 Phóng to
                </span>
              </div>
            </div>
            {alt && <p className="text-xs text-slate-500 mt-1">{alt}</p>}
          </div>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto">

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bot className="w-6 h-6 text-emerald-400" />
            Vigilance AI — Chatbot
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Text-to-SQL · Gemini 2.0 Flash · Streamhouse 3-Layer (HOT/WARM/COLD)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {healthStatus === 'ok' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Chatbot online
            </span>
          )}
          {healthStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="w-3.5 h-3.5" />
              Chatbot offline
            </span>
          )}
        </div>
      </div>

      {/* ── Paimon latency notice ── */}
      <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-xs text-amber-400 flex items-center gap-2">
        <Clock className="w-4 h-4 flex-shrink-0" />
        <span>
          Truy vấn lớp <strong>WARM (Paimon)</strong> có thể mất <strong>10–30 giây</strong> qua Trino Paimon connector.
          Truy vấn lớp <strong>COLD (Iceberg)</strong> qua Trino chỉ mất ~10–20 giây.
        </span>
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto bg-slate-900/50 rounded-xl border border-slate-800 p-6 space-y-6">

        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
          >
            {/* Bot avatar */}
            {message.role === 'model' && (
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.isError ? 'bg-red-500/20' : 'bg-emerald-500/20'
              }`}>
                {message.isThinking
                  ? <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
                  : <Bot className={`w-5 h-5 ${message.isError ? 'text-red-400' : 'text-emerald-400'}`} />
                }
              </div>
            )}

            {/* Bubble */}
            <div className={`flex flex-col gap-1 max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>

              {/* Layer + duration badges (bot only) */}
              {message.role === 'model' && !message.isThinking && (message.layer || message.duration_ms) && (
                <div className="flex items-center gap-2 flex-wrap">
                  {message.layer && <LayerBadge layer={message.layer} />}
                  {message.duration_ms && (
                    <span className="text-xs text-slate-500 font-mono">
                      {message.duration_ms >= 60000
                        ? `${(message.duration_ms / 60000).toFixed(1)} phút`
                        : `${(message.duration_ms / 1000).toFixed(1)}s`}
                    </span>
                  )}
                  {message.confidence && (
                    <span className="text-xs text-slate-600 font-mono">
                      confidence {Math.round(message.confidence * 100)}%
                    </span>
                  )}
                </div>
              )}

              {/* Message content */}
              <div className={`px-4 py-3 rounded-xl text-sm leading-relaxed ${
                message.role === 'user'
                  ? 'bg-blue-600/50 text-white rounded-br-none'
                  : message.isError
                    ? 'bg-red-900/30 text-red-300 border border-red-800/40 rounded-bl-none'
                    : 'bg-slate-800 text-slate-300 rounded-bl-none'
              }`}>
                {message.isThinking ? (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phân tích & truy vấn Streamhouse…</span>
                  </div>
                ) : (
                  renderMarkdown(message.content)
                )}
                {/* Direct evidence gallery — renders frame_urls as grid if content has no images */}
                {message.frame_urls && message.frame_urls.length > 0 && !message.content?.includes('![') && (
                  <div className="mt-3">
                    <p className="text-xs text-slate-400 font-semibold mb-2">
                      Ảnh bằng chứng ({message.frame_urls.length} ảnh):
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {message.frame_urls.slice(0, 12).map((url, i) => (
                        <div
                          key={i}
                          className="relative rounded-lg overflow-hidden border border-slate-600 cursor-pointer group"
                          onClick={() => setExpandedImg({ src: url, alt: `Ảnh bằng chứng ${i + 1}` })}
                        >
                          <img
                            src={url}
                            alt={`Ảnh ${i + 1}`}
                            className="w-full h-20 object-cover group-hover:opacity-90 transition-opacity"
                            onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition" />
                        </div>
                      ))}
                    </div>
                    {message.frame_urls.length > 12 && (
                      <p className="text-xs text-slate-500 mt-1">...và {message.frame_urls.length - 12} ảnh khác</p>
                    )}
                  </div>
                )}
                {message.role === 'model' && !message.isThinking && (
                  <Citations citations={message.citations} />
                )}
              </div>
            </div>

            {/* User avatar */}
            {message.role === 'user' && (
              <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-slate-300" />
              </div>
            )}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Suggested queries ── */}
      {messages.length <= 2 && !isLoading && (
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTED_QUERIES.map((q) => (
            <button
              key={q}
              onClick={() => handleSuggestion(q)}
              className="px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ── Offline warning ── */}
      {healthStatus === 'error' && (
        <div className="mt-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            Chatbot đang offline. Khởi động Docker stack:{' '}
            <code className="bg-slate-800 px-1 rounded font-mono">
              docker compose -f docker/docker-compose.yml up -d chatbot
            </code>
          </span>
        </div>
      )}

      {/* ── Lightbox modal ── */}
      {expandedImg && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedImg(null)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setExpandedImg(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm"
            >
              ✕ Đóng
            </button>
            <img
              src={expandedImg.src}
              alt={expandedImg.alt}
              className="w-full rounded-xl border border-slate-700 shadow-2xl"
              onError={e => { e.target.alt = 'Ảnh không tải được'; }}
            />
            {expandedImg.alt && (
              <p className="text-slate-400 text-sm mt-2 text-center">{expandedImg.alt}</p>
            )}
          </div>
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="mt-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              healthStatus === 'error'
                ? 'Chatbot offline — hãy khởi động Docker stack trước'
                : 'Hỏi về alert, camera, hoặc xu hướng bạo lực…'
            }
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all placeholder-slate-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || healthStatus === 'error'}
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-5 rounded-lg transition-all disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center gap-2"
            disabled={isLoading || !input.trim() || healthStatus === 'error'}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chatbot;
