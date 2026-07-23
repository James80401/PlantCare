import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { diagnosisChatApi } from '../services/api';
import { trackOnce } from '../utils/analytics';
import { formatApiErrorMessage } from '../utils/apiError';
import { DR_PLANT_HASH } from '../utils/gardenPaths';
import { taskTypeLabel } from '../utils/tasks';
import { resolveApiAssetUrl } from '../utils/apiAssets';

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  imageUrl?: string | null;
  source?: string | null;
  createdAt: string;
}

interface ConversationListItem {
  id: string;
  title: string | null;
  updatedAt: string;
  _count: { messages: number };
  messages?: Array<{ role: string; content: string; createdAt: string }>;
}

interface DrPlantChatProps {
  plantId: string;
  plantName?: string;
}

interface ChatRecoverySuggestion {
  key: string;
  label: string;
  taskType: string;
  dueInDays: number;
  alreadyScheduled: boolean;
}

interface ChatActionDraft {
  key: string;
  kind: 'recommendation' | 'task';
  title: string;
  body: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionLabel?: string;
  actionPath?: string;
  taskType?: string;
  dueInDays?: number;
}

interface GuidedContextQuestion {
  id: string;
  label: string;
  prompt: string;
  type: 'single' | 'text';
  options?: string[];
}

interface GuidedContextResponse {
  title: string;
  summary: string;
  questions: GuidedContextQuestion[];
}

const GUIDED_FOLLOW_UPS = [
  {
    label: '7-day recovery plan',
    prompt:
      'Create a simple 7-day recovery plan for this plant with what to watch, what to avoid, and when to check back.',
  },
  {
    label: 'Compare progress',
    prompt:
      'Based on the latest symptoms and photos in this thread, tell me what would count as improving, unchanged, or worse.',
  },
  {
    label: 'Care task ideas',
    prompt:
      'Suggest any care tasks I should add for this plant and explain which ones are urgent versus optional.',
  },
];

function isOpenAiSetupError(message: string) {
  return /openai|api key|billing/i.test(message);
}

export default function DrPlantChat({ plantId, plantName = 'this plant' }: DrPlantChatProps) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [lastReplyAt, setLastReplyAt] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastFailedPayload = useRef<{
    text: string;
    photo: File | null;
    requestId: string;
  } | null>(null);

  const loadConversations = useCallback(() => {
    diagnosisChatApi.list(plantId).then((r) => setConversations(r.data));
  }, [plantId]);

  const loadThread = useCallback(
    (conversationId: string) => {
      setActiveId(conversationId);
      setError('');
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
  }, [messages, loading, lastReplyAt]);

  const startNew = () => {
    setActiveId(null);
    setMessages([]);
    setError('');
    setInput('');
    setPhoto(null);
    lastFailedPayload.current = null;
  };

  const sendWithPayload = async (text: string, image?: File, retryRequestId?: string) => {
    const trimmed = text.trim();
    if (!trimmed && !image) return;

    setLoading(true);
    setError('');
    setActionNotice('');
    setActionError('');
    const requestId = retryRequestId ?? crypto.randomUUID();
    lastFailedPayload.current = { text: trimmed, photo: image ?? null, requestId };

    try {
      if (!activeId) {
        const { data } = await diagnosisChatApi.create(
          plantId,
          trimmed,
          image,
          requestId,
        );
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
          trimmed,
          image,
          requestId,
        );
        setMessages((prev) => [...prev, data.userMessage, data.assistantMessage]);
      }
      setInput('');
      setPhoto(null);
      lastFailedPayload.current = null;
      setLastReplyAt(new Date().toISOString());
      trackOnce('first_dr_plant_message', 'first_dr_plant_message', { plantId });
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

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    await sendWithPayload(input, photo ?? undefined);
  };

  const sendPrompt = (prompt: string) => {
    void sendWithPayload(prompt);
  };

  const retryLast = () => {
    const last = lastFailedPayload.current;
    if (!last) return;
    setInput(last.text);
    setPhoto(last.photo);
    void sendWithPayload(last.text, last.photo ?? undefined, last.requestId);
  };

  const saveReplyToJournal = async (message: ChatMessage) => {
    if (!activeId) return;
    setActionLoading(`journal:${message.id}`);
    setActionNotice('');
    setActionError('');
    try {
      await diagnosisChatApi.saveJournalNote(plantId, activeId, message.id);
      setActionNotice('Saved Dr. Plant reply to the journal.');
    } catch (err: unknown) {
      setActionError(formatApiErrorMessage(err, 'Could not save this reply to the journal.'));
    } finally {
      setActionLoading('');
    }
  };

  const scheduleHealthCheck = async (message: ChatMessage, dueInDays = 3) => {
    if (!activeId) return;
    setActionLoading(`health:${message.id}:${dueInDays}`);
    setActionNotice('');
    setActionError('');
    try {
      await diagnosisChatApi.scheduleHealthCheck(plantId, activeId, message.id, dueInDays);
      setActionNotice(`Scheduled a health check in ${dueInDays} days.`);
    } catch (err: unknown) {
      setActionError(formatApiErrorMessage(err, 'Could not schedule a health check.'));
    } finally {
      setActionLoading('');
    }
  };

  const conversationPreview = (c: ConversationListItem) => {
    const last = c.messages?.[0];
    if (last?.content) return last.content.slice(0, 48);
    return c.title || 'Chat';
  };

  return (
    <div
      id={DR_PLANT_HASH}
      className="scroll-anchor rounded-2xl border border-emerald-200 bg-white overflow-hidden shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-100 bg-emerald-50/80 px-4 py-3">
        <div>
          <h2 className="font-semibold text-emerald-900">Dr. Plant</h2>
          <p className="text-xs text-gray-600">
            Chat about symptoms for {plantName}. Advice uses this plant's saved context when available.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={startNew}
            className="min-h-11 text-xs font-medium text-emerald-800 bg-white border border-emerald-200 px-3 py-2 rounded-full hover:bg-emerald-50"
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
              className={`shrink-0 max-w-[12rem] text-left text-xs px-3 py-2 rounded-2xl border transition ${
                activeId === c.id
                  ? 'bg-emerald-800 text-white border-emerald-800'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
              }`}
            >
              <span className="block truncate font-semibold">
                {(c.title || 'Chat').slice(0, 24)}
              </span>
              <span
                className={`mt-0.5 block truncate text-[0.65rem] ${
                  activeId === c.id ? 'text-emerald-100' : 'text-gray-500'
                }`}
              >
                {conversationPreview(c)}
                {c._count.messages > 0 ? ` - ${c._count.messages} msgs` : ''}
              </span>
              <span
                className={`mt-0.5 block text-[0.6rem] ${
                  activeId === c.id ? 'text-emerald-200' : 'text-gray-400'
                }`}
              >
                {formatDistanceToNow(new Date(c.updatedAt), { addSuffix: true })}
              </span>
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-800 space-y-2">
          <p>{error}</p>
          {isOpenAiSetupError(error) ? (
            <p className="text-xs">
              Add <code className="rounded bg-red-100 px-1">OPENAI_API_KEY</code> to the API{' '}
              <code className="rounded bg-red-100 px-1">.env</code> and restart{' '}
              <code className="rounded bg-red-100 px-1">npm run dev:api</code>. See{' '}
              <Link to="/garden/settings" className="font-semibold underline">
                settings
              </Link>{' '}
              and docs/getting-started/troubleshooting.
            </p>
          ) : null}
          {lastFailedPayload.current ? (
            <button
              type="button"
              onClick={retryLast}
              className="min-h-9 rounded-full bg-white px-3 py-1 text-xs font-semibold text-red-900 ring-1 ring-red-200 hover:bg-red-100"
            >
              Try again
            </button>
          ) : null}
        </div>
      )}

      {(actionNotice || actionError) && (
        <div
          className={`mx-4 mt-3 rounded-lg border px-3 py-2 text-sm ${
            actionError
              ? 'border-red-200 bg-red-50 text-red-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
          role={actionError ? 'alert' : 'status'}
        >
          {actionError || actionNotice}
        </div>
      )}

      {lastReplyAt && !loading && !error && messages.length > 0 && (
        <p className="mx-4 mt-2 text-xs font-medium text-emerald-700" role="status">
          Dr. Plant replied - {format(new Date(lastReplyAt), 'h:mm a')}
        </p>
      )}

      <div className="border-b border-emerald-50 bg-white px-4 py-3">
        <div className="mb-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
            How Dr. Plant advice works
          </p>
          <p className="mt-1 text-xs leading-5 text-gray-600">
            Ask questions freely here. Save a structured diagnosis when you want a result in health
            history, and review every task or recommendation draft before it changes care.
          </p>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Guided follow-ups
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              Ask for missing context, a recovery plan, or next task ideas.
            </p>
          </div>
          {activeId ? (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                sendPrompt(
                  'Summarize this thread into a journal-ready update with symptoms, likely cause, care changes, and next check-in.',
                )
              }
              className="min-h-9 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
            >
              Summarize thread
            </button>
          ) : null}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {!activeId ? (
            <button
              type="button"
              disabled={loading}
              onClick={() =>
                sendPrompt(
                  'Ask me the most important missing context questions before you give more advice for this plant.',
                )
              }
              className="min-h-10 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-xs font-semibold text-emerald-900 hover:border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
            >
              Missing context
            </button>
          ) : null}
          {GUIDED_FOLLOW_UPS.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={loading}
              onClick={() => sendPrompt(item.prompt)}
              className="min-h-10 rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-left text-xs font-semibold text-emerald-900 hover:border-emerald-200 hover:bg-emerald-100 disabled:opacity-50"
            >
              {item.label}
            </button>
          ))}
        </div>
        {activeId ? (
          <GuidedContextPanel
            plantId={plantId}
            conversationId={activeId}
            disabled={loading}
            onSubmit={(prompt) => sendWithPayload(prompt)}
          />
        ) : null}
      </div>

      <div className="h-72 sm:h-80 overflow-y-auto px-4 py-3 space-y-3 bg-[#f7f6f2]/50">
        {messages.length === 0 && !loading && (
          <p className="text-sm text-gray-500 text-center py-8">
            Describe what you see, such as yellow leaves, spots, or drooping. You can attach a
            photo when visual symptoms matter.
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
                    src={resolveApiAssetUrl(m.imageUrl) ?? undefined}
                    alt=""
                    className="rounded-lg mb-2 max-h-40 object-cover w-full"
                  />
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                {!isUser && m.source ? (
                  <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
                    {m.source === 'openai'
                      ? 'AI-assisted guidance'
                      : 'Rules-based care guidance'}
                  </p>
                ) : null}
                <p
                  className={`text-[10px] mt-1 ${isUser ? 'text-emerald-200' : 'text-gray-400'}`}
                >
                  {format(new Date(m.createdAt), 'h:mm a')}
                </p>
                {!isUser && activeId ? (
                  <>
                    <div className="mt-2 border-t border-emerald-50 pt-2">
                      <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wide text-emerald-700">
                        Save or schedule from this reply
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveReplyToJournal(m)}
                          disabled={Boolean(actionLoading)}
                          className="min-h-8 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {actionLoading === `journal:${m.id}` ? 'Saving...' : 'Save reply as journal note'}
                        </button>
                        <button
                          type="button"
                          onClick={() => scheduleHealthCheck(m, 3)}
                          disabled={Boolean(actionLoading)}
                          className="min-h-8 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        >
                          {actionLoading === `health:${m.id}:3` ? 'Scheduling...' : 'Schedule health check in 3 days'}
                        </button>
                        <button
                          type="button"
                          onClick={() => scheduleHealthCheck(m, 7)}
                          disabled={Boolean(actionLoading)}
                          className="min-h-8 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50"
                        >
                          {actionLoading === `health:${m.id}:7` ? 'Scheduling...' : 'Schedule check in 7 days'}
                        </button>
                      </div>
                    </div>
                    <ChatRecoveryTasks
                      plantId={plantId}
                      conversationId={activeId}
                      messageId={m.id}
                    />
                    <ChatActionCards
                      plantId={plantId}
                      conversationId={activeId}
                      messageId={m.id}
                    />
                  </>
                ) : null}
              </div>
            </div>
          );
        })}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-emerald-100 rounded-2xl px-4 py-3 text-sm text-gray-500">
              <span className="inline-flex gap-1">
                <span className="animate-bounce">.</span>
                <span className="animate-bounce [animation-delay:0.15s]">.</span>
                <span className="animate-bounce [animation-delay:0.3s]">.</span>
              </span>
              Dr. Plant is thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="border-t border-emerald-100 p-3 space-y-2 bg-white">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Dr. Plant..."
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex min-h-11 cursor-pointer items-center text-xs text-emerald-800 border border-emerald-200 rounded-lg px-3 py-2 hover:bg-emerald-50">
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
              className="min-h-11 text-xs text-gray-500 underline"
            >
              Remove
            </button>
          )}
          <button
            type="submit"
            disabled={loading || (!input.trim() && !photo)}
            className="ml-auto min-h-11 bg-emerald-800 text-white text-sm font-medium px-5 py-2 rounded-full hover:bg-emerald-900 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function GuidedContextPanel({
  plantId,
  conversationId,
  disabled,
  onSubmit,
}: {
  plantId: string;
  conversationId: string;
  disabled: boolean;
  onSubmit: (prompt: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [guide, setGuide] = useState<GuidedContextResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await diagnosisChatApi.getGuidedContextQuestions(
        plantId,
        conversationId,
      );
      setGuide(data);
      setAnswers((prev) => {
        const next = { ...prev };
        for (const question of data.questions) {
          if (!(question.id in next)) next[question.id] = '';
        }
        return next;
      });
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not load follow-up questions.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !guide && !loading) {
      void load();
    }
  };

  const answered = guide?.questions.filter((question) => answers[question.id]?.trim()) ?? [];

  const submit = async () => {
    if (!guide || answered.length === 0) return;
    setSubmitting(true);
    setError('');
    const lines = answered.map(
      (question) => `- ${question.prompt}: ${answers[question.id].trim()}`,
    );
    try {
      await onSubmit(
        [
          'Here is the missing context for this Dr. Plant follow-up:',
          ...lines,
          '',
          'Please update your advice using this context. Point out what changed, what still seems uncertain, and the next best action.',
        ].join('\n'),
      );
      setExpanded(false);
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not send follow-up context.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl border border-teal-100 bg-teal-50/70 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-teal-950">Missing context check</p>
          <p className="mt-0.5 text-xs text-teal-800">
            Answer quick prompts before asking for revised advice.
          </p>
        </div>
        <button
          type="button"
          disabled={disabled}
          onClick={toggleExpanded}
          className="min-h-9 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-teal-900 ring-1 ring-teal-200 hover:bg-teal-50 disabled:opacity-50"
        >
          {expanded ? 'Hide questions' : 'Answer questions'}
        </button>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-xs text-teal-800">Finding the most useful questions...</p>
          ) : null}

          {guide ? (
            <>
              <p className="text-xs text-gray-600">{guide.summary}</p>
              <div className="space-y-3">
                {guide.questions.map((question) => (
                  <fieldset
                    key={question.id}
                    className="rounded-2xl border border-teal-100 bg-white p-3"
                  >
                    <legend className="px-1 text-xs font-semibold text-emerald-950">
                      {question.label}
                    </legend>
                    {question.type === 'single' ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {(question.options ?? []).map((option) => {
                          const selected = answers[question.id] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() =>
                                setAnswers((prev) => ({
                                  ...prev,
                                  [question.id]: selected ? '' : option,
                                }))
                              }
                              className={`min-h-9 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
                                selected
                                  ? 'bg-emerald-800 text-white ring-emerald-800'
                                  : 'bg-teal-50 text-teal-900 ring-teal-100 hover:bg-teal-100'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea
                        value={answers[question.id] ?? ''}
                        onChange={(event) =>
                          setAnswers((prev) => ({
                            ...prev,
                            [question.id]: event.target.value,
                          }))
                        }
                        rows={2}
                        className="mt-2 w-full rounded-xl border border-teal-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30"
                        placeholder="Add a short observation..."
                      />
                    )}
                  </fieldset>
                ))}
              </div>
            </>
          ) : null}

          {error ? (
            <p className="text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}

          {guide ? (
            <button
              type="button"
              disabled={disabled || submitting || answered.length === 0}
              onClick={submit}
              className="min-h-10 rounded-full bg-teal-800 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-900 disabled:opacity-50"
            >
              {submitting
                ? 'Sending...'
                : `Send ${answered.length} answer${answered.length === 1 ? '' : 's'}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function dueLabel(dueInDays: number): string {
  if (dueInDays <= 0) return 'Due today';
  if (dueInDays === 1) return 'Due tomorrow';
  return `Due in ${dueInDays} days`;
}

function ChatRecoveryTasks({
  plantId,
  conversationId,
  messageId,
}: {
  plantId: string;
  conversationId: string;
  messageId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatRecoverySuggestion[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await diagnosisChatApi.getRecoverySuggestions(
        plantId,
        conversationId,
        messageId,
      );
      const nextSuggestions = data.suggestions ?? [];
      setSuggestions(nextSuggestions);
      setSelected(new Set(nextSuggestions.filter((s: ChatRecoverySuggestion) => !s.alreadyScheduled).map((s: ChatRecoverySuggestion) => s.key)));
      setLoaded(true);
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not load recovery task ideas.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && !loaded && !loading) {
      void load();
    }
  };

  const toggle = (key: string, disabled: boolean) => {
    if (disabled) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
    setSuccess('');
  };

  const apply = async () => {
    const keys = [...selected];
    if (!keys.length) return;
    setApplying(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await diagnosisChatApi.applyRecoveryTasks(
        plantId,
        conversationId,
        messageId,
        keys,
      );
      setSuccess(
        data.length === 1
          ? '1 recovery task added.'
          : `${data.length} recovery tasks added.`,
      );
      await load();
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not add recovery tasks.'));
    } finally {
      setApplying(false);
    }
  };

  const selectable = suggestions.filter((suggestion) => !suggestion.alreadyScheduled);

  return (
    <div className="mt-2 border-t border-emerald-50 pt-2">
      <button
        type="button"
        onClick={toggleExpanded}
        className="min-h-8 rounded-full bg-lime-50 px-3 py-1 text-xs font-semibold text-lime-900 hover:bg-lime-100"
      >
        {expanded ? 'Hide recovery task drafts' : 'Review recovery task drafts'}
      </button>

      {expanded ? (
        <div className="mt-2 rounded-2xl border border-lime-100 bg-lime-50/60 p-3">
          <div className="mb-3">
            <p className="text-xs font-semibold text-emerald-950">Recovery task drafts</p>
            <p className="mt-0.5 text-xs leading-5 text-lime-900">
              Select the follow-ups you want. Nothing is added to care tasks until you confirm.
            </p>
          </div>
          {loading ? (
            <p className="text-xs text-gray-600">Loading task ideas...</p>
          ) : suggestions.length === 0 ? (
            <p className="text-xs text-gray-600">No clear task ideas found in this reply.</p>
          ) : (
            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const disabled = suggestion.alreadyScheduled;
                const checked = disabled || selected.has(suggestion.key);
                return (
                  <label
                    key={suggestion.key}
                    className={`flex gap-2 rounded-xl border bg-white px-2.5 py-2 text-xs ${
                      disabled
                        ? 'border-lime-50 opacity-70'
                        : 'border-lime-100 hover:bg-lime-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-lime-200 text-lime-700"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => toggle(suggestion.key, disabled)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-emerald-950">
                        {suggestion.label}
                      </span>
                      <span className="mt-0.5 block text-lime-800">
                        {taskTypeLabel(suggestion.taskType)} - {dueLabel(suggestion.dueInDays)}
                        {disabled ? ' - Already scheduled' : ''}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {error ? (
            <p className="mt-2 text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-2 text-xs font-semibold text-emerald-800" role="status">
              {success}
            </p>
          ) : null}

          {selectable.length > 0 ? (
            <button
              type="button"
              disabled={applying || selected.size === 0}
              onClick={apply}
              className="mt-3 min-h-9 rounded-full bg-lime-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-lime-800 disabled:opacity-50"
            >
              {applying ? 'Adding...' : `Confirm ${selected.size} recovery task${selected.size === 1 ? '' : 's'}`}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ChatActionCards({
  plantId,
  conversationId,
  messageId,
}: {
  plantId: string;
  conversationId: string;
  messageId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [drafts, setDrafts] = useState<ChatActionDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyKey, setBusyKey] = useState('');
  const [confirmedKeys, setConfirmedKeys] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await diagnosisChatApi.getActionDrafts(
        plantId,
        conversationId,
        messageId,
      );
      setDrafts(data.drafts ?? []);
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not draft action cards.'));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    if (next && drafts.length === 0 && !loading) {
      void load();
    }
  };

  const confirm = async (draft: ChatActionDraft) => {
    setBusyKey(draft.key);
    setError('');
    setSuccess('');
    try {
      if (draft.kind === 'recommendation') {
        await diagnosisChatApi.confirmRecommendationDraft(
          plantId,
          conversationId,
          messageId,
          draft.key,
        );
        setSuccess('Recommendation saved as optional guidance.');
      } else {
        await diagnosisChatApi.confirmTaskDraft(
          plantId,
          conversationId,
          messageId,
          draft.key,
        );
        setSuccess('Task added to your care list.');
      }
      setConfirmedKeys((prev) => new Set(prev).add(draft.key));
    } catch (err: unknown) {
      setError(formatApiErrorMessage(err, 'Could not confirm that action.'));
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="mt-2 border-t border-emerald-50 pt-2">
      <button
        type="button"
        onClick={toggleExpanded}
        className="min-h-8 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
      >
        {expanded ? 'Hide action card drafts' : 'Review action card drafts'}
      </button>

      {expanded ? (
        <div className="mt-2 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-emerald-950">Confirm before changing care</p>
              <p className="mt-0.5 text-xs text-emerald-800">
                Review each draft. Recommendations stay optional; tasks become due care only after
                you confirm.
              </p>
            </div>
            {drafts.length > 0 ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => void load()}
                className="min-h-8 rounded-full bg-white px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-50 disabled:opacity-50"
              >
                Refresh drafts
              </button>
            ) : null}
          </div>

          {loading ? (
            <p className="mt-3 text-xs text-gray-600">Drafting action cards...</p>
          ) : drafts.length === 0 ? (
            <p className="mt-3 text-xs text-gray-600">
              No action cards found in this reply yet. You can still save the reply as a journal
              note or ask Dr. Plant for more specific next steps.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {drafts.map((draft) => {
                const confirmed = confirmedKeys.has(draft.key);
                const isTask = draft.kind === 'task';
                return (
                  <article
                    key={draft.key}
                    className="rounded-2xl border border-emerald-100 bg-white p-3 text-xs"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-emerald-950">{draft.title}</p>
                        <p className="mt-1 leading-5 text-gray-700">{draft.body}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                        {isTask ? 'task draft - needs confirmation' : 'recommendation draft - optional'}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-[0.68rem] text-gray-600">
                      <span className="rounded-full bg-gray-50 px-2 py-0.5">
                        {draft.priority.toLowerCase()} priority
                      </span>
                      {draft.taskType ? (
                        <span className="rounded-full bg-gray-50 px-2 py-0.5">
                          {taskTypeLabel(draft.taskType)}
                        </span>
                      ) : null}
                      {draft.dueInDays != null ? (
                        <span className="rounded-full bg-gray-50 px-2 py-0.5">
                          {dueLabel(draft.dueInDays)}
                        </span>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      disabled={Boolean(busyKey) || confirmed}
                      onClick={() => void confirm(draft)}
                      className={`mt-3 min-h-10 rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 ${
                        isTask
                          ? 'bg-amber-700 hover:bg-amber-800'
                          : 'bg-emerald-800 hover:bg-emerald-900'
                      }`}
                    >
                      {confirmed
                        ? 'Confirmed'
                        : busyKey === draft.key
                          ? 'Confirming...'
                          : isTask
                            ? 'Confirm task'
                            : 'Confirm recommendation'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}

          {error ? (
            <p className="mt-2 text-xs text-rose-700" role="alert">
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="mt-2 text-xs font-semibold text-emerald-800" role="status">
              {success}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
