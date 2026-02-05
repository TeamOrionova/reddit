import React, { useEffect, useState } from 'react';
import { getLeads } from '../api';
import { ExternalLink, TrendingUp, User, Activity } from 'lucide-react';

const LeadViewer = () => {
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        const fetchLeads = async () => {
            try {
                const response = await getLeads();
                setLeads(response.data);
            } catch (error) {
                console.error("Failed to fetch leads", error);
            }
        };
        fetchLeads();
        const interval = setInterval(fetchLeads, 30000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-card rounded-[2.5rem] p-10 shadow-2xl overflow-hidden relative border-slate-700/40">
            <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full -mr-20 -mt-20"></div>

            <div className="flex justify-between items-center mb-10 relative z-10">
                <div className="flex items-center">
                    <div className="w-12 h-12 bg-sky-500/10 rounded-2xl flex items-center justify-center mr-4 border border-sky-500/20">
                        <TrendingUp className="w-6 h-6 text-sky-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">Discovery Feed</h2>
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-0.5">Real-time Opportunities</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all border border-slate-700/50">Export CSV</button>
                    <button className="px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 text-xs font-bold rounded-xl transition-all border border-sky-500/20">Filter</button>
                </div>
            </div>

            <div className="space-y-6 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                {leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                        <div className="w-16 h-16 bg-slate-800/40 rounded-full flex items-center justify-center mb-4 border border-slate-700/30">
                            <Activity className="w-8 h-8 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">Scanning subreddits...</p>
                        <p className="text-xs uppercase tracking-widest mt-2 font-bold opacity-50">Discovery engine online</p>
                    </div>
                ) : (
                    leads.map(lead => (
                        <div key={lead.id} className="bg-slate-800/40 p-6 rounded-3xl hover:bg-slate-800/60 transition-all duration-300 border border-slate-700/30 hover:border-sky-500/30 group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 mr-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase tracking-widest">
                                            r/{lead.subreddit}
                                        </span>
                                        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-slate-700/50 text-slate-400 border border-slate-600/30 uppercase tracking-widest leading-none flex items-center">
                                            <User className="w-3 h-3 mr-1.5 opacity-50" />
                                            u/{lead.author}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition duration-300 tracking-tight">{lead.title}</h3>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="flex items-center bg-slate-900/50 px-4 py-2 rounded-2xl border border-slate-700/50">
                                        <span className="text-xs font-bold text-slate-500 mr-2 uppercase tracking-tighter">Match</span>
                                        <span className={`text-lg font-black tracking-tighter ${lead.score > 85 ? 'text-emerald-400' : lead.score > 70 ? 'text-sky-400' : 'text-amber-400'}`}>
                                            {lead.score}%
                                        </span>
                                    </div>
                                    <a href={lead.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-700/50 hover:bg-sky-500/20 text-slate-400 hover:text-sky-400 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-600/30 hover:border-sky-500/30 shadow-lg">
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>
                            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                                {lead.body}
                            </p>
                            <div className="mt-6 pt-5 border-t border-slate-700/20 flex justify-between items-center">
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                                    {new Date(lead.created_at).toLocaleDateString()} • {new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <div className="flex gap-2">
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">Archive</button>
                                    <div className="w-1 h-1 rounded-full bg-slate-700 self-center"></div>
                                    <button className="text-[10px] font-bold uppercase tracking-widest text-sky-400 hover:text-sky-300 transition-colors">Connect</button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LeadViewer;
