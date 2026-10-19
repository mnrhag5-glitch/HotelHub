import { useEffect, useRef, useState } from "react";
import { chatSocket } from "../services/chatSocket";

export default function HotelLiveChat({ hotelId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const conversationIdRef = useRef(null);
  const currentCustomerIdRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !hotelId) return;

    let active = true;

    conversationIdRef.current = null;
    currentCustomerIdRef.current = null;
    setConversationId(null);
    setMessages([]);
    setError("");
    setStatus("connecting");

    const handleConnect = () => {
      if (!active) return;

      setStatus("connecting");
      setError("");

      chatSocket.emit("chat:join", { hotelId }, (result) => {
        if (!active) return;

        if (!result?.success) {
          setStatus("error");
          setError(
            result?.message ||
              "Unable to open chat. Please login and try again.",
          );
          return;
        }

        const id = result.conversation?.id || result.conversation?._id;

        currentCustomerIdRef.current =
          result.conversation?.customerId ||
          result.conversation?.customer?._id ||
          result.conversation?.customer ||
          null;

        if (!id) {
          setStatus("error");
          setError("Conversation ID missing from server response.");
          return;
        }

        conversationIdRef.current = String(id);
        setConversationId(String(id));
        console.log("CUSTOMER ID:", currentCustomerIdRef.current);
        console.log(
          "SENDER IDS:",
          result.messages?.map((item) => item.sender),
        );
        setMessages(result.messages || []);
        setStatus("connected");
      });
    };

    const handleConnectError = () => {
      if (!active) return;

      setStatus("error");
      setError("Chat connect nahi ho paya. Login karke dobara try karo.");
    };

    const handleNewMessage = (newMessage) => {
      if (!active) return;

      const eventConversationId =
        typeof newMessage?.conversation === "object"
          ? newMessage.conversation?._id
          : newMessage?.conversation;

      if (String(eventConversationId) !== conversationIdRef.current) {
        return;
      }

      setMessages((previous) => {
        if (previous.some((item) => item._id === newMessage._id)) {
          return previous;
        }

        return [...previous, newMessage];
      });
    };

    chatSocket.on("connect", handleConnect);
    chatSocket.on("connect_error", handleConnectError);
    chatSocket.on("chat:new-message", handleNewMessage);

    if (chatSocket.connected) {
      handleConnect();
    } else {
      chatSocket.connect();
    }

    return () => {
      active = false;

      chatSocket.off("connect", handleConnect);
      chatSocket.off("connect_error", handleConnectError);
      chatSocket.off("chat:new-message", handleNewMessage);

      conversationIdRef.current = null;
      chatSocket.disconnect();
    };
  }, [isOpen, hotelId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  const sendMessage = (event) => {
    event.preventDefault();

    const text = message.trim();
    const activeConversationId = conversationIdRef.current;

    if (!text || !activeConversationId || status !== "connected" || sending) {
      return;
    }

    setSending(true);
    setError("");

    chatSocket.emit(
      "chat:send",
      {
        conversationId: activeConversationId,
        message: text,
      },
      (result) => {
        setSending(false);

        if (!result?.success) {
          setError(result?.message || "Message send nahi hua.");
          return;
        }

        setMessage("");
      },
    );
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <section className="mb-3 flex h-[480px] w-[min(360px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-gray-900 px-4 py-4 text-white">
            <div>
              <h3 className="font-semibold">HotelHub Support</h3>
              <p className="text-xs text-gray-300">
                {status === "connected"
                  ? "Chat connected"
                  : status === "connecting"
                    ? "Connecting..."
                    : status === "error"
                      ? "Connection issue"
                      : "Customer support"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-lg px-3 py-1 text-xl hover:bg-gray-700"
              aria-label="Close chat"
            >
              ×
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 p-4">
            {status === "connecting" && (
              <p className="text-center text-sm text-gray-500">
                Connecting to support...
              </p>
            )}

            {status === "error" && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            {status === "connected" && messages.length === 0 && (
              <p className="text-center text-sm text-gray-500">
                Hello! How can we help you with this hotel?
              </p>
            )}

            {messages.map((item, index) => {
              const senderId =
                typeof item.sender === "object"
                  ? item.sender?._id || item.sender?.id
                  : item.sender;

              const isCustomerMessage =
                String(senderId) === String(currentCustomerIdRef.current);

              return (
                <div
                  key={item._id || item.id || index}
                  className={`flex w-full ${
                    isCustomerMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] break-words rounded-2xl px-3 py-2 text-sm ${
                      isCustomerMessage
                        ? "rounded-br-sm bg-[#dceafe] text-[#1e3555]"
                        : "rounded-bl-sm border border-gray-200 bg-white text-gray-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{item.message}</p>

                    <p className="mt-1 text-right text-[10px] text-gray-400">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </p>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>

          {error && status === "connected" && (
            <p className="px-3 pt-2 text-xs text-red-600">{error}</p>
          )}

          <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={2000}
              placeholder="Type your message..."
              disabled={status !== "connected" || sending}
              className="min-w-0 flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
            />

            <button
              type="submit"
              disabled={status !== "connected" || !message.trim() || sending}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sending ? "..." : "Send"}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((previous) => !previous)}
        className="flex items-center gap-2 rounded-full bg-gray-900 px-5 py-3 font-semibold text-white shadow-lg transition hover:bg-gray-700"
        aria-expanded={isOpen}
      >
        <span aria-hidden="true">💬</span>
        {isOpen ? "Close Chat" : "Contact Hotel"}
      </button>
    </div>
  );
}
