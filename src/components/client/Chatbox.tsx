import { useState, useRef, useEffect, type FormEvent } from 'react';
import { MessageCircle, X, Send, Leaf, ChevronDown } from 'lucide-react';

type Message = {
  id: number;
  from: 'user' | 'bot';
  text: string;
};

const FAQ_RESPONSES: Record<string, string> = {
  'giao hàng': 'Chúng tôi giao hàng toàn quốc trong 2–4 ngày làm việc. Miễn phí vận chuyển cho đơn từ 500.000đ.',
  'đổi trả': 'Bạn có thể đổi trả sản phẩm trong vòng 7 ngày kể từ ngày nhận hàng nếu sản phẩm bị lỗi hoặc không đúng mô tả.',
  'thanh toán': 'Chúng tôi hỗ trợ: Thanh toán khi nhận hàng (COD), Chuyển khoản ngân hàng, Ví MoMo.',
  'phân bón': 'Chúng tôi cung cấp đầy đủ các loại phân bón hữu cơ, phân NPK, phân vi sinh. Hãy xem thêm tại mục Sản phẩm.',
  'thuốc': 'Chúng tôi bán thuốc bảo vệ thực vật chính hãng, có đầy đủ giấy phép lưu hành. Vui lòng xem tại mục Sản phẩm.',
  'liên hệ': 'Hotline: 1800 6863 (miễn phí). Email: support@cultivatedledger.vn. Giờ làm việc: 7:00 – 21:00 mỗi ngày.',
  'khuyến mãi': 'Chúng tôi thường xuyên có chương trình giảm giá. Đăng ký nhận email để cập nhật sớm nhất!',
};

const WELCOME = 'Xin chào! 🌿 Tôi là trợ lý của Cultivated Ledger. Tôi có thể giúp bạn tìm hiểu về sản phẩm, chính sách giao hàng, đổi trả, và nhiều hơn nữa. Hỏi tôi bất cứ điều gì!';

const QUICK_QUESTIONS = [
  'Chính sách giao hàng?',
  'Đổi trả như thế nào?',
  'Các hình thức thanh toán?',
  'Hotline liên hệ?',
];

let messageIdCounter = 3;

export default function Chatbox() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, from: 'bot', text: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [open, messages]);

  const getResponse = (text: string): string => {
    const lower = text.toLowerCase();
    for (const [keyword, response] of Object.entries(FAQ_RESPONSES)) {
      if (lower.includes(keyword)) return response;
    }
    return 'Cảm ơn bạn đã liên hệ! Câu hỏi của bạn sẽ được chuyển đến nhân viên hỗ trợ. Trong thời gian chờ, bạn có thể gọi hotline 1800 6863 (miễn phí) để được hỗ trợ nhanh nhất.';
  };

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: messageIdCounter++, from: 'user', text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: messageIdCounter++,
        from: 'bot',
        text: getResponse(text),
      };
      setMessages((m) => [...m, botMsg]);
      setTyping(false);
      if (!open) setUnread((u) => u + 1);
    }, 1000 + Math.random() * 500);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_0_6px_rgba(0,0,0,0.24),0_8px_12px_rgba(0,0,0,0.14)] transition-all hover:scale-105 active:scale-95"
        style={{ background: '#00754A' }}
        aria-label="Mở hộp chat"
      >
        {open ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#c82014] text-[10px] font-black text-white">
            {unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl shadow-2xl sm:w-96"
          style={{ height: '480px', maxHeight: 'calc(100vh - 120px)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1E3932' }}>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: '#00754A' }}
              >
                <Leaf size={15} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Hỗ trợ Cultivated Ledger</p>
                <p className="flex items-center gap-1 text-[10px] text-white/60">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400" /> Trực tuyến
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-white px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.from === 'bot' && (
                  <div
                    className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full self-end"
                    style={{ background: '#d4e9e2' }}
                  >
                    <Leaf size={13} style={{ color: '#006241' }} />
                  </div>
                )}
                <div
                  className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.from === 'user'
                      ? 'rounded-br-sm text-white'
                      : 'rounded-bl-sm text-[#1E3932]'
                  }`}
                  style={
                    msg.from === 'user'
                      ? { background: '#006241' }
                      : { background: '#f2f0eb' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start">
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ background: '#d4e9e2' }}>
                  <Leaf size={13} style={{ color: '#006241' }} />
                </div>
                <div className="rounded-2xl rounded-bl-sm px-4 py-3" style={{ background: '#f2f0eb' }}>
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-1.5 w-1.5 rounded-full bg-[#006241]"
                        style={{ animation: `bounce 1s ${i * 0.2}s ease-in-out infinite` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          <div className="border-t border-black/5 bg-white px-3 py-2">
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="shrink-0 rounded-full border border-[#006241]/20 px-3 py-1.5 text-[11px] font-semibold text-[#006241] transition hover:bg-[#006241]/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-black/5 bg-white px-3 py-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              className="flex-1 rounded-full bg-[#f2f0eb] px-4 py-2 text-sm outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white disabled:opacity-40 transition active:scale-95"
              style={{ background: '#006241' }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
