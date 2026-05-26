import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { diagnosisChatApi } from '../services/api';
import { formatApiErrorMessage } from '../utils/apiError';

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
}

interface ConversationListItem {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
}

interface DrPlantChatProps {
  plantId: string;
  plantName?: string;
}

export default function DrPlantChat({ plantId, plantName = 'this plant' }: DrPlantChatProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(() => {
    diagnosisChatApi.list(plantId).then((r) => setConversations(r.data));
  }, [plantId]);

  const loadThread = useCallback(
    (conversationId: string) => {
      setActiveId(conversationId);
      diagnosisChatApi.get(plantId, conversationId).then((r) => {
        setMessages(r.data.messages ?? []);
      });
    },
    [plantId],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setError('');
    setInput('');
    setPhoto(null);
  };

  const usePrompt = (prompt: string) => {
    setInput(prompt);
  };

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text && !photo) return;

    setLoading(true);
    setError('');

    try {
      if (!activeId) {
        const { data } = await diagnosisChatApi.create(plantId, text, photo ?? undefined);
        if (data.id && data.messages) {
          setMessages(data.messages);
          setActiveId(data.id);
        } else if (data.userMessage && data.assistantMessage) {
          setActiveId(data.conversationId);
          setMessages([data.userMessage, data.assistantMessage]);
        } else if (data.conversationId) {
          loadThread(data.conversationId);
        }
      } else {
        const { data } = await diagnosisChatApi.sendMessage(
          plantId,
          activeId,
          text,
          photo ?? undefined,
        );
        setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      }
      setInput('');
      setPhoto(null);
      loadConversations();
    } catch (err: unknown) {
      setError(
        formatApiErrorMessage(
          err,
          'Could not reach Dr. Plant. Check your OpenAI API key and billing.',
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="dr-plant"
      className="scroll-mt-28 rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/80 px-4 py-3">
        <div>
          <h2 className="font-semibold text-emerald-900">Dr. Plant</h2>
          <p className="text-xs text-gray-600">
            Chat about symptoms for {plantName} — follow up anytime
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startNew}
            className="text-xs font-medium text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-full hover:bg-emerald-50"
          >
            New chat
          </button>
        </div>
      </div>

      {conversations.length > 0 && (
        <div className="flex gap-2 overflow-x-auto px-3 py-2 border-b border-emerald-50 bg-gray-50/50">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => loadThread(c.id)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition ${
                activeId === c.id
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              }`}
            >
              {(c.title || 'Chat').slice(0, 28)}
              {c._count.messages > 0 ? ` (${c._count.messages})` : ''}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="border-b border-emerald-50 bg-white px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Useful follow-up prompts
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {[
            'What should I check first today?',
            'Has this issue improved based on my latest photo?',
            'What recovery signs should I look for?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => usePrompt(prompt)}
              className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 sm:h-80 overflow-y-auto px-4 py-3 space-y-3 bg-[#f7f6f2]/50">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center py-8">
            Describe what you see — yellow leaves, spots, drooping — or attach a photo to start.
          </p>
        )}
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  isUser
                    ? 'bg-emerald-800 text-white rounded-br-md'
                    : 'bg-white border border-emerald-100 text-gray-800 rounded-bl-md shadow-sm'
                }`}
              >
                {m.imageUrl && (
                  <img
                    src={m.imageUrl}
                    alt=""
                    className="rounded-lg mb-2 max-h-40 object-cover w-full"
                  />
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                <p
                  className={`text-[10px] mt-1 ${isUser ? 'text-emerald-200' : 'text-gray-400'}`}
                >
                  {format(new Date(m.createdAt), 'h:mm a')}
                </p>
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">·</span>
                <span className="animate-bounce [animation-delay:0.15s]">·</span>
                <span className="animate-bounce [animation-delay:0.3s]">·</span>
              </span>
              Dr. Plant is thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-emerald-100 p-3 space-y-2 bg-white">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Dr. Plant…"
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs text-emerald-800 cursor-pointer border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">
            {photo ? photo.name.slice(0, 20) : 'Attach photo'}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          {photo && (
            <button
              type="button"
              onClick={() => setPhoto(null)}
              className="text-xs text-gray-500 underline"
            >
              Remove
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (!input.trim() && !photo)}
            className="ml-auto bg-emerald-800 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-emerald-900 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
