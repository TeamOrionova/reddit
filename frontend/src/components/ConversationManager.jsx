import React, { useEffect, useState } from 'react';
import { getConversations, toggleTakeover } from '../api';
import { MessageSquare, User, Power, Bot } from 'lucide-react';

const ConversationManager = () => {
    const [conversations, setConversations] = useState([]);
    const [selectedId, setSelectedId] = useState(null);

    const fetchConvs = async () => {
        try {
            const res = await getConversations();
            setConversations(res.data);
        } catch (e) {
            console.error("Failed to fetch conversations", e);
        }
    };

    useEffect(() => {
        fetchConvs();
        const interval = setInterval(fetchConvs, 5000);
        return () => clearInterval(interval);
    }, []);

    const selectedConv = conversations.find(c => c.id === selectedId);

    const handleTakeover = async (enable) => {
        if (!selectedConv) return;
        await toggleTakeover(selectedConv.reddit_username, enable);
        fetchConvs(); // refresh
    };

    return (
        <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 h-[600px] flex overflow-hidden">
            {/* List */}
            <div className="w-1/3 border-r border-gray-700 overflow-y-auto custom-scrollbar bg-gray-800/50">
                <div className="p-4 border-b border-gray-700 bg-gray-800 sticky top-0 z-10 backdrop-blur-md">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <MessageSquare className="w-4 h-4 mr-2 text-purple-400" />
                        Chats
                    </h2>
                </div>
                {conversations.length === 0 ? (
                    <div className="p-4 text-gray-500 text-sm text-center">No conversations yet</div>
                ) : (
                    conversations.map(c => (
                        <div
                            key={c.id}
                            onClick={() => setSelectedId(c.id)}
                            className={`p-4 border-b border-gray-700 cursor-pointer hover:bg-gray-700/50 transition ${selectedId === c.id ? 'bg-gray-700/80 border-l-4 border-l-purple-500' : 'border-l-4 border-l-transparent'}`}
                        >
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-gray-200 truncate pr-2">u/{c.reddit_username}</span>
                                {c.human_takeover && <Power className="w-3 h-3 text-red-400 shrink-0" />}
                            </div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500 capitalize">{c.status}</span>
                                <span className="text-xs text-gray-600">{new Date(c.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Chat View */}
            <div className="w-2/3 flex flex-col bg-gray-900/50">
                {selectedConv ? (
                    <>
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
                            <div className="flex items-center text-white">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mr-3">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-bold">u/{selectedConv.reddit_username}</span>
                            </div>
                            <button
                                onClick={() => handleTakeover(!selectedConv.human_takeover)}
                                className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center transition shadow-lg ${selectedConv.human_takeover ? 'bg-red-500/20 text-red-300 border border-red-500/50 hover:bg-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/50 hover:bg-green-500/30'}`}
                            >
                                <Power className="w-3 h-3 mr-1.5" />
                                {selectedConv.human_takeover ? 'Takeover Active' : 'Auto-Pilot On'}
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                            {selectedConv.messages && selectedConv.messages.length > 0 ? (
                                selectedConv.messages.map((m, idx) => (
                                    <div key={idx} className={`flex ${m.role === 'assistant' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm shadow-md ${m.role === 'assistant' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-100 rounded-bl-none'}`}>
                                            <div className="flex items-center mb-1 opacity-70 text-[10px] uppercase font-bold tracking-wider">
                                                {m.role === 'assistant' ? <Bot className="w-3 h-3 mr-1" /> : <User className="w-3 h-3 mr-1" />}
                                                {m.role === 'assistant' ? 'AI Agent' : selectedConv.reddit_username}
                                            </div>
                                            <div className="leading-relaxed">{m.content}</div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center text-gray-500 mt-10 text-sm">No messages yet.</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                        <p>Select a conversation to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConversationManager;
