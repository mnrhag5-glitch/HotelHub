
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatSocket } from "../services/chatSocket";
import Navbar from "../components/Navbar";

const getId = (value) =>
  String(
    typeof value === "object" && value !== null
      ? value._id || value.id || ""
      : value || ""
  );

const getTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getDateLabel = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    day: "numeric",
    month: "short",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
};

const getCustomerName = (conversation) =>
  conversation?.customer?.name ||
  conversation?.customer?.email ||
  "Customer";

const getInitial = (name) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "C";


const isAdminMessage = (item, conversation) => {
  const role = String(
    item.sender?.role || item.senderRole || ""
  ).toLowerCase();

  if (role === "admin" || item.sender?.isAdmin === true) {
    return true;
  }

  const senderId = getId(item.sender);
  const customerId = getId(conversation?.customer);

  // Admin view mein customer ke alawa doosra sender admin hai.
  if (senderId && customerId && senderId !== customerId) {
    return true;
  }

  return false;
};


export default function AdminLiveChat() {
  const [conversations, setConversations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  const selectedRef = useRef(null);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  const loadConversations = useCallback(() => {
    chatSocket.emit(
      "chat:admin:list",
      { page: 1, limit: 50 },
      (result) => {
        if (!result?.success) {
          setError(result?.message || "Could not load conversations.");
          setLoading(false);
          return;
        }

        const list = result.conversations || [];
        setConversations(list);
        setError("");
        setLoading(false);

        const currentId = selectedRef.current;
        if (currentId) {
          const updated = list.find(
            (item) => getId(item) === currentId
          );
          if (updated) setSelected(updated);
        }
      }
    );
  }, []);

  useEffect(() => {
    const onConnect = () => loadConversations();

    const onConnectError = () => {
      setError(
        "Chat server se connect nahi ho pa raha. Login aur backend check karo."
      );
      setLoading(false);
    };

    const onNewMessage = (item) => {
      const conversationId = getId(item.conversation);

      setConversations((previous) =>
        previous
          .map((conversation) =>
            getId(conversation) === conversationId
              ? {
                  ...conversation,
                  lastMessage: item.message,
                  lastMessageAt:
                    item.createdAt || new Date().toISOString(),
                }
              : conversation
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt || 0) -
              new Date(a.lastMessageAt || a.updatedAt || 0)
          )
      );

      if (conversationId === selectedRef.current) {
        if (item.senderRole !== "admin") {
          chatSocket.emit("chat:join-conversation", { conversationId }, () => {
            chatSocket.emit("chat:admin:unread-count", {}, () => {});
          });
        }
        setMessages((previous) =>
          previous.some((entry) => getId(entry) === getId(item))
            ? previous
            : [...previous, item]
        );
      }
    };

    // Backend should broadcast this event after successful deletion.
    const onMessageDeleted = (payload) => {
      const deletedId = getId(payload.messageId || payload._id);
      const conversationId = getId(payload.conversationId || payload.conversation);

      if (!deletedId) return;

      if (conversationId === selectedRef.current) {
        setMessages((previous) =>
          previous.filter((item) => getId(item) !== deletedId)
        );
      }

      loadConversations();
    };

    chatSocket.on("connect", onConnect);
    chatSocket.on("connect_error", onConnectError);
    chatSocket.on("chat:new-message", onNewMessage);
    chatSocket.on("chat:message-deleted", onMessageDeleted);

    if (chatSocket.connected) {
      loadConversations();
    } else {
      chatSocket.connect();
    }

    return () => {
      chatSocket.off("connect", onConnect);
      chatSocket.off("connect_error", onConnectError);
      chatSocket.off("chat:new-message", onNewMessage);
      chatSocket.off("chat:message-deleted", onMessageDeleted);
    };
  }, [loadConversations]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;

    return conversations.filter((conversation) => {
      const customer = getCustomerName(conversation).toLowerCase();
      const hotel = (conversation.hotel?.name || "").toLowerCase();
      const lastMessage = (conversation.lastMessage || "").toLowerCase();

      return (
        customer.includes(query) ||
        hotel.includes(query) ||
        lastMessage.includes(query)
      );
    });
  }, [conversations, search]);

 

const openConversation = (conversation) => {
  
    const id = String(conversation._id || conversation.id);

    selectedRef.current = id;
    setSelected(conversation);
    setMobileChatOpen(true);
    setError("");

    chatSocket.emit(
        "chat:join-conversation",
        { conversationId: id },
        (result) => {
            if (String(selectedRef.current) !== id) return;

            if (!result?.success) {
                setError(
                    result?.message || "Could not open this conversation."
                );
                return;
            }
            console.log("CHAT HISTORY RESPONSE:", result);

            if (Array.isArray(result.messages)) {
                setMessages(result.messages);
            } else {
                setError("Chat history backend se receive nahi hui.");
            }
        }
    );
};



  const sendMessage = (event) => {
    event.preventDefault();

    const text = message.trim();
    const id = selectedRef.current;

    if (!text || !id || sending) return;

    setSending(true);
    setError("");

    chatSocket.emit(
      "chat:send",
      { conversationId: id, message: text },
      (result) => {
        setSending(false);

        if (!result?.success) {
          setError(result?.message || "Message send nahi hua.");
          return;
        }

        setMessage("");
        inputRef.current?.focus();
      }
    );
  };

  const deleteMessage = (item) => {
    const messageId = getId(item);
    const conversationId = selectedRef.current;

    if (!messageId || !conversationId || deletingId) return;

    const confirmed = window.confirm(
      "Kya tum is message ko permanently delete karna chahte ho?"
    );
    if (!confirmed) return;

    setDeletingId(messageId);
    setError("");

    // Requires a matching, authorized backend Socket.IO handler.
    chatSocket.emit(
      "chat:delete-message",
      { conversationId, messageId },
      (result) => {
        setDeletingId("");

        if (!result?.success) {
          setError(
            result?.message ||
              "Message delete nahi hua. Backend delete handler check karo."
          );
          return;
        }

        setMessages((previous) =>
          previous.filter((entry) => getId(entry) !== messageId)
        );

        loadConversations();
      }
    );
  };

  const selectedId = getId(selected);

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt || 0) -
          new Date(b.createdAt || 0)
      ),
    [messages]
  );

  let lastDateLabel = "";

  return (
    <div className="min-h-screen bg-[#f3f6fb] text-[#17243b]">
      <Navbar />

      <main className="mx-auto max-w-[1600px] px-3 py-4 sm:px-5 sm:py-6 lg:px-8">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#244d85] text-white shadow-md shadow-blue-900/15">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
              <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
              <path d="M8 11h.01M12 11h.01M16 11h.01" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#152640] sm:text-3xl">
              Live Chat Inbox
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage customer conversations across HotelHub.
            </p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Dismiss error">✕</button>
          </div>
        )}


<div className="grid h-[calc(100dvh-150px)] min-h-[400px] grid-cols-1 overflow-hidden rounded-2xl border border-[#e0e7f0] bg-white shadow-[0_12px_45px_rgba(25,45,75,0.07)] md:h-[calc(100dvh-190px)] md:min-h-[570px] md:grid-cols-[310px_minmax(0,1fr)] lg:grid-cols-[350px_minmax(0,1fr)]">

          {/* Conversation list */}
          <aside className={`min-h-0 flex-col border-r border-[#e6ebf2] bg-white ${mobileChatOpen ? "hidden md:flex" : "flex"}`}>
            <div className="border-b border-[#e9edf4] px-4 pb-4 pt-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#192b46]">Messages</h2>
                  <p className="mt-1 text-xs text-slate-500">{conversations.length} conversations</p>
                </div>
                <button type="button" onClick={loadConversations} className="rounded-xl border border-[#e1e8f1] px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-[#eef4fc]">
                  Refresh
                </button>
              </div>

              <label className="flex h-11 items-center gap-2 rounded-xl border border-[#e3e9f2] bg-[#f7f9fc] px-3 focus-within:border-[#8baad4] focus-within:bg-white">
                <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-slate-500" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="10.8" cy="10.8" r="6.8" />
                  <path d="m16 16 4 4" strokeLinecap="round" />
                </svg>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search conversations..." className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400" />
              </label>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-4 text-sm text-slate-500">Loading conversations...</p>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  {search ? "No matching conversations." : "No customer conversations yet."}
                </div>
              ) : (
                filteredConversations.map((conversation) => {
                  const id = getId(conversation);
                  const active = selectedId === id;
                  const customer = getCustomerName(conversation);

                  return (
                    <button key={id} type="button" onClick={() => openConversation(conversation)} className={`relative flex w-full gap-3 border-b border-[#eff2f7] px-4 py-4 text-left transition ${active ? "bg-[#edf4ff]" : "hover:bg-[#f7f9fc]"}`}>
                      {active && <span className="absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full bg-[#315f9f]" />}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dceafe] to-[#b8d3f7] text-lg font-semibold text-[#254b7c]">
                        {getInitial(customer)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-[#1c2d47]">{customer}</p>
                          <time className="shrink-0 text-[10px] text-slate-500">{getTime(conversation.lastMessageAt || conversation.updatedAt)}</time>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-[#526987]">{conversation.hotel?.name || "Hotel conversation"}</p>
                        <p className="mt-2 truncate text-xs leading-5 text-slate-500">{conversation.lastMessage || "Start a conversation"}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-[#e9edf4] bg-[#fafbfd] px-4 py-3 text-xs text-slate-500">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#4a9b82]" />
              HotelHub support inbox
            </div>
          </aside>

          {/* Chat area */}
          <section className={`min-h-0 min-w-0 flex-col bg-[#f8fafd] ${mobileChatOpen ? "flex" : "hidden md:flex"}`}>
            {!selected ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[26px] bg-[#eaf1fb] text-[#315f9f]">
                  <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="1.5">
                    <path d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H6l-3 2v-6.5A7.5 7.5 0 1 1 20 11.5Z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-[#20334f]">Your conversations, all in one place</h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">Select a customer to view the chat history and reply in real time.</p>
              </div>
            ) : (
              <>
                <header className="flex min-h-[76px] items-center gap-3 border-b border-[#e5ebf3] bg-white px-3 py-3 sm:px-5">
                  <button type="button" onClick={() => setMobileChatOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 md:hidden" aria-label="Back to conversations">←</button>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#dceafe] to-[#b8d3f7] text-lg font-semibold text-[#254b7c]">
                    {getInitial(getCustomerName(selected))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-bold text-[#1c2d47] sm:text-base">{getCustomerName(selected)}</h2>
                    <p className="mt-1 truncate text-xs text-slate-500">{selected.hotel?.name || "Hotel conversation"}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#4a8c77]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#4a9b82]" />
                      Customer support chat
                    </p>
                  </div>
                  <span className="hidden rounded-lg bg-[#f0f5fc] px-3 py-2 text-xs font-medium text-[#315f9f] sm:inline-flex">HotelHub</span>
                </header>

                <div className="flex-1 overflow-y-auto bg-[#f5f7fb] px-3 py-5 sm:px-6">
                  <div className="mx-auto flex max-w-4xl flex-col gap-3">
                    <div className="mb-2 flex justify-center">
                      <span className="rounded-full border border-[#e4eaf2] bg-white px-3 py-1.5 text-[10px] font-semibold text-slate-500 shadow-sm">Conversation history</span>
                    </div>

                    {sortedMessages.length === 0 && (
                      <p className="my-8 text-center text-sm text-slate-500">No messages yet. Send a reply to start the conversation.</p>
                    )}

                    {sortedMessages.map((item, index) => {
                      const currentDate = getDateLabel(item.createdAt);
                      const showDate = currentDate && currentDate !== lastDateLabel;
                      lastDateLabel = currentDate || lastDateLabel;
                      const adminMessage = isAdminMessage(item, selected);
                      const messageId = getId(item);

                      return (
                        <div key={messageId || `${item.createdAt}-${index}`}>
                          {showDate && (
                            <div className="my-3 flex justify-center">
                              <span className="rounded-full border border-[#e5eaf2] bg-white px-3 py-1 text-[10px] font-medium text-slate-500">{currentDate}</span>
                            </div>
                          )}

                          <div className={`group flex items-end gap-2 ${adminMessage ? "justify-end" : "justify-start"}`}>
                            {!adminMessage && (
                              <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dceafe] text-xs font-semibold text-[#254b7c]">
                                {getInitial(getCustomerName(selected))}
                              </div>
                            )}

                            <div className={`relative max-w-[88%] rounded-2xl px-4 py-3 shadow-[0_2px_5px_rgba(20,40,70,0.035)] sm:max-w-[75%] ${
                              adminMessage
                                ? "rounded-br-md border border-[#cbdff9] bg-[#e3efff] text-[#1d3556]"
                                : "rounded-bl-md border border-[#e5eaf1] bg-white text-[#27364b]"
                            }`}>
                              <p className="whitespace-pre-wrap break-words text-[13px] leading-6 sm:text-sm">{item.message}</p>
                              <div className={`mt-1.5 flex items-center justify-end gap-1.5 text-[10px] ${adminMessage ? "text-[#607fa7]" : "text-slate-400"}`}>
                                <span>{getTime(item.createdAt)}</span>
                                {adminMessage && <span aria-label="Sent">✓✓</span>}
                              </div>

                              <button
                                type="button"
                                onClick={() => deleteMessage(item)}
                                disabled={deletingId === messageId}
                                title="Delete message"
                                aria-label="Delete message"
                                  className="absolute -top-3 right-1 flex h-7 w-7 items-center justify-center rounded-lg border border-red-100 bg-white text-red-500 shadow-sm transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"                         >
                                {deletingId === messageId ? (
                                  <span className="text-[10px]">...</span>
                                ) : (
                                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                                    <path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            </div>

                            {adminMessage && (
                              <div className="mb-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#244d85] text-xs font-semibold text-white">A</div>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    <div ref={endRef} />
                  </div>
                </div>

                <form onSubmit={sendMessage} className="border-t border-[#e5ebf3] bg-white px-3 py-3 sm:px-5 sm:py-4">
                  <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-2xl border border-[#e0e7f0] bg-[#f8fafd] p-2 transition focus-within:border-[#9ab5d9] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(49,95,159,0.07)]">
                    <textarea
                      ref={inputRef}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                          event.preventDefault();
                          event.currentTarget.form?.requestSubmit();
                        }
                      }}
                      maxLength={2000}
                      rows={1}
                      placeholder="Write your reply..."
                      aria-label="Message"
                      className="max-h-32 min-h-10 min-w-0 flex-1 resize-y bg-transparent px-2 py-2.5 text-sm leading-5 text-[#26364d] outline-none placeholder:text-slate-400"
                    />
                    <button type="submit" disabled={!message.trim() || sending} aria-label="Send message" className="flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#244d85] px-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#193c6d] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 sm:px-4">
                      {sending ? "Sending..." : (
                        <>
                          <span className="hidden sm:inline">Send</span>
                          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="1.8">
                            <path d="m22 2-7 20-4-9-9-4 20-7Z" strokeLinejoin="round" />
                            <path d="M22 2 11 13" strokeLinecap="round" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mx-auto mt-2 max-w-4xl px-1 text-[10px] text-slate-400">Press Enter to send · Shift + Enter for a new line</p>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
