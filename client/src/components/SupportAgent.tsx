import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircleHeart, X, Send, Loader2, ChevronDown, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  escalated?: boolean;
}

export default function SupportAgent() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm the C.A.R.E.N. support agent. I'm here to help you with any questions, issues, or concerns about the app. What can I help you with today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [pulse, setPulse] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 12000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, messages]);

  const sendMessage = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const history = nextMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          userEmail: userEmail || (user as any)?.email || undefined,
          userName: user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || undefined : undefined,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "I'm sorry, something went wrong. Please try again.";
      const wasEscalated = !!data.escalated;

      setMessages((prev) => [...prev, { role: "assistant", content: reply, escalated: wasEscalated }]);

      if (wasEscalated) {
        setEscalated(true);
        setShowEmailPrompt(!userEmail && !(user as any)?.email);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now. Please try again in a moment, or email us at support@carenalert.com.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickReplies = [
    "How do I start recording?",
    "I can't log in",
    "What does my plan include?",
    "I need to speak to someone",
  ];

  return (
    <>
      {/* Floating button — bottom-left, distinct from AI chat (bottom-right) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open support chat"
          className={`fixed bottom-6 left-6 z-50 w-14 h-14 bg-gradient-to-br from-violet-600 to-purple-700 rounded-full shadow-lg shadow-violet-500/40 flex items-center justify-center hover:scale-110 transition-transform duration-200 group ${pulse ? "animate-pulse" : ""}`}
        >
          <MessageCircleHeart className="w-6 h-6 text-white" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-6 left-6 z-50 w-[340px] sm:w-[380px] h-[520px] flex flex-col bg-gray-900/97 backdrop-blur-xl border border-violet-500/20 rounded-2xl shadow-2xl shadow-violet-500/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-900/80 to-purple-900/80 border-b border-violet-500/20 flex-shrink-0">
            <div className="relative">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <MessageCircleHeart className="w-4 h-4 text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">C.A.R.E.N. Support</p>
              <p className="text-xs text-violet-300">Always here to help</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 scrollbar-thin">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                    <MessageCircleHeart className="w-3 h-3 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white rounded-br-sm"
                      : "bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700/50"
                  }`}
                >
                  {msg.content}
                  {msg.escalated && (
                    <div className="mt-2 flex items-center gap-1.5 text-yellow-400 text-xs font-medium">
                      <AlertTriangle className="w-3 h-3" />
                      Flagged for team review
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircleHeart className="w-3 h-3 text-white" />
                </div>
                <div className="bg-gray-800 border border-gray-700/50 rounded-2xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                </div>
              </div>
            )}

            {/* Email prompt after escalation */}
            {showEmailPrompt && !loading && (
              <div className="bg-violet-900/30 border border-violet-500/30 rounded-xl p-3">
                <p className="text-xs text-violet-300 mb-2">Share your email so our team can follow up:</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="h-8 text-xs bg-gray-800 border-gray-600 text-white flex-1"
                  />
                  <Button
                    size="sm"
                    onClick={() => setShowEmailPrompt(false)}
                    className="h-8 text-xs bg-violet-600 hover:bg-violet-700"
                  >
                    Done
                  </Button>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick replies (only when conversation is short) */}
          {messages.length <= 2 && !loading && (
            <div className="px-3 pb-2 flex flex-wrap gap-1.5">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  className="text-xs bg-gray-800 border border-gray-700 text-gray-300 hover:text-white hover:border-violet-500/50 hover:bg-gray-700 rounded-full px-2.5 py-1 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 pb-3 pt-1 border-t border-gray-700/50 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type your question..."
                disabled={loading}
                className="flex-1 h-9 text-sm bg-gray-800 border-gray-600 text-white placeholder-gray-500 focus:border-violet-500"
              />
              <Button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                size="icon"
                className="h-9 w-9 flex-shrink-0 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-gray-600 mt-1.5">
              Powered by C.A.R.E.N.™ AI Support
            </p>
          </div>
        </div>
      )}
    </>
  );
}
