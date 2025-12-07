import { useState, useEffect, useRef } from 'react';
import { askAi } from '../lib/ai';
import Supabase from '../lib/supabase';
import { Bot } from 'lucide-react'

// AiChat widget: visible only when `currentUser` prop exists (user or admin)
export default function AiChat({ currentUser }) {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  // (favorites removed) movie save UI removed per request

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  // load user's conversations when component mounts / currentUser changes
  useEffect(() => {
    if (!currentUser || !Supabase) return;
    (async () => {
      try {
        const { data, error } = await Supabase.from('conversations').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
        if (error) {
          console.warn('Could not load conversations:', error.message);
        } else {
          setConversations(data || []);
          if (data && data.length > 0) {
            // load messages for the most recent conversation
            const first = data[0];
            setCurrentConversation(first);
            await loadMessages(first.id);
          }
        }
      } catch (err) {
        console.error('Load conv error', err);
      }
    })();
  }, [currentUser]);

  async function loadMessages(conversationId) {
    if (!Supabase) return;
    try {
      const { data, error } = await Supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
      if (error) {
        console.warn('Could not load messages:', error.message);
        setMessages([]);
      } else {
        setMessages(data || []);
      }
    } catch (err) {
      console.error(err);
    }
  }

  // Only render widget for authenticated users (including admins)
  if (!currentUser) return null;

  const handleInputChange = (e) => {
    setPrompt(e.target.value);
  };

  async function ensureConversation() {
    if (currentConversation) return currentConversation;
    // create a new conversation
    try {
      const { data, error } = await Supabase.from('conversations').insert([{ user_id: currentUser.id, title: 'Chat' }]).select().single();
      if (error) {
        console.warn('Could not create conversation:', error.message);
        return null;
      }
      const conv = data;
      setConversations((c) => [conv, ...c]);
      setCurrentConversation(conv);
      setMessages([]);
      return conv;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!prompt.trim()) return;
    setIsLoading(true);

    // ensure conversation exists
    const conv = await ensureConversation();
    if (!conv) {
      setIsLoading(false);
      return;
    }

    // insert user message
    try {
      const { error: insertErr, data: inserted } = await Supabase.from('messages').insert([
        { conversation_id: conv.id, role: 'user', content: prompt }
      ]).select().single();
      if (insertErr) console.warn('Could not insert message:', insertErr.message);
      else setMessages((m) => [...m, inserted]);
    } catch (err) {
      console.error('Insert message error', err);
    }

    // call AI
    try {
      const aiResp = await askAi(prompt);
      const text = (typeof aiResp === 'string') ? aiResp : JSON.stringify(aiResp);

      // insert assistant message
      try {
        const { error: aErr, data: aData } = await Supabase.from('messages').insert([
          { conversation_id: conv.id, role: 'assistant', content: text }
        ]).select().single();
        if (aErr) console.warn('Could not insert assistant message:', aErr.message);
        else setMessages((m) => [...m, aData]);
      } catch (err) {
        console.error('Insert assistant message error', err);
      }
    } catch (err) {
      console.error('AI error', err);
    }

    setPrompt('');
    setIsLoading(false);
  };

  // favorites functionality removed

  return (
    <div className="fixed right-6 bottom-6 z-50">
      {/* Minimized button when closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-orange-500 text-white shadow-lg hover:bg-orange-400 transition cursor-pointer"
          title="Open Chat"
        >
          <span className="animate-pulse"><Bot /></span>
        </button>
      )}

      {/* Widget panel when open */}
      {isOpen && (
        <div className="w-96 bg-neutral-900/95 text-white rounded-2xl shadow-2xl border border-orange-400/30 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-neutral-800/70">
            <div className="text-orange-400 font-semibold">ChaGPT</div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setIsOpen(false); }} className="text-gray-300 px-2 py-1">Close</button>
            </div>
          </div>

          <div className="p-3">
            <div className="max-h-64 overflow-auto mb-3 space-y-2">
              {messages.length === 0 && <div className="text-neutral-400 italic">No messages yet.</div>}
              {messages.map((m) => (
                <div key={m.id} className={`p-2 rounded ${m.role === 'user' ? 'bg-neutral-800 text-right' : 'bg-neutral-700 text-left'}`}>
                  <div className="text-sm">{m.content}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
              <input
                ref={inputRef}
                className="flex-1 rounded-full px-3 py-2 bg-neutral-800 border border-neutral-700 focus:outline-none focus:ring-2 focus:ring-orange-400 text-white placeholder:text-neutral-500"
                type="text"
                value={prompt}
                onChange={handleInputChange}
                placeholder="Ask Charlie..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="rounded-full px-3 py-2 bg-orange-600 hover:bg-orange-500 transition text-white font-semibold shadow disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isLoading || !prompt.trim()}
              >
                {isLoading ? <span className="animate-pulse">...</span> : 'Send'}
              </button>
            </form>

            {/* favorites UI removed */}
          </div>
        </div>
      )}
    </div>
  );
}
