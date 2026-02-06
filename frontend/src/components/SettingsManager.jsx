import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../api';
import { Plus, X, Save, Share2, Search } from 'lucide-react';

const SettingsManager = () => {
    const [subreddits, setSubreddits] = useState([]);
    const [newSub, setNewSub] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getSettings('monitored_subreddits');
                if (res.data && res.data.list) {
                    setSubreddits(res.data.list);
                } else {
                    // Default list if none exists
                    setSubreddits(['sales', 'remotejobs', 'forhire']);
                }
            } catch (error) {
                console.error("Failed to fetch settings", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const addSubreddit = () => {
        let clean = newSub.trim().toLowerCase();
        if (clean.startsWith('r/')) clean = clean.substring(2);
        if (clean && !subreddits.includes(clean)) {
            setSubreddits([...subreddits, clean]);
            setNewSub('');
        }
    };

    const removeSubreddit = (sub) => {
        setSubreddits(subreddits.filter(s => s !== sub));
    };

    const saveSettings = async () => {
        setSaving(true);
        try {
            await updateSettings('monitored_subreddits', { list: subreddits });
            alert("Subreddits updated! The bot will sync during its next check.");
        } catch (error) {
            console.error("Failed to save settings", error);
            alert("Save failed. Check backend connection.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-slate-500">Initializing settings...</div>;

    return (
        <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 blur-[100px] rounded-full -ml-20 -mt-20"></div>

            <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Subreddit Targeting</h2>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-1">Configure your AI focus zones</p>
                    </div>
                    <button
                        onClick={saveSettings}
                        disabled={saving}
                        className="flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-2xl font-bold shadow-lg shadow-orange-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {saving ? 'Saving...' : 'Sync to Bot'}
                    </button>
                </div>

                <div className="bg-slate-900/40 p-1.5 rounded-2xl border border-slate-700/50 flex items-center mb-8 focus-within:border-orange-500/50 transition-all">
                    <div className="w-10 h-10 flex items-center justify-center text-slate-500">
                        <Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        value={newSub}
                        onChange={(e) => setNewSub(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSubreddit()}
                        placeholder="Add subreddit (e.g. r/sales)"
                        className="bg-transparent border-none focus:ring-0 text-white flex-1 text-sm font-medium px-2"
                    />
                    <button
                        onClick={addSubreddit}
                        className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-xl text-slate-300 transition-colors mr-1"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex flex-wrap gap-4 min-h-[200px] content-start">
                    {subreddits.length === 0 && (
                        <div className="w-full flex flex-col items-center justify-center py-10 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl">
                            <Share2 className="w-10 h-10 mb-2 opacity-20" />
                            <p className="text-sm">No subreddits targeted. Bot current idle.</p>
                        </div>
                    )}
                    {subreddits.map(sub => (
                        <div
                            key={sub}
                            className="group flex items-center bg-slate-800/60 hover:bg-orange-500/10 border border-slate-700/50 hover:border-orange-500/30 px-5 py-3 rounded-2xl transition-all animate-in fade-in zoom-in duration-300"
                        >
                            <span className="text-xs font-bold text-slate-400 group-hover:text-orange-400 mr-2">r/</span>
                            <span className="font-bold text-white tracking-tight">{sub}</span>
                            <button
                                onClick={() => removeSubreddit(sub)}
                                className="ml-4 p-1 hover:bg-red-500/20 rounded-lg text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-12 p-6 bg-slate-900/60 rounded-3xl border border-slate-800/50">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Targeting Tips</h4>
                    <ul className="grid grid-cols-2 gap-4">
                        <li className="text-[11px] text-slate-400 flex items-start italic leading-relaxed">
                            Focus on niche career subs for higher quality leads than generic ones.
                        </li>
                        <li className="text-[11px] text-slate-400 flex items-start italic leading-relaxed">
                            The AI will automatically handle keyword filtering within these subs.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default SettingsManager;
