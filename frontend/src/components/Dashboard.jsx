import React, { useState } from 'react';
import LeadViewer from './LeadViewer';
import ConversationManager from './ConversationManager';
import SystemHealth from './SystemHealth';
import SettingsManager from './SettingsManager';
import { LayoutDashboard, MessageSquare, Activity, Settings, Zap } from 'lucide-react';

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('leads');

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans selection:bg-sky-500 selection:text-white">
            {/* Sidebar */}
            <aside className="fixed top-0 left-0 h-full w-72 glass-sidebar p-6 flex flex-col z-50">
                <div className="flex items-center mb-12 px-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl mr-4 flex items-center justify-center shadow-xl shadow-sky-500/20 animate-float">
                        <Zap className="w-7 h-7 text-white fill-white/10" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white leading-none">AutoRep<span className="text-sky-400">.</span>ai</h1>
                        <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-bold mt-1">Intelligence Layer</p>
                    </div>
                </div>

                <nav className="space-y-3 flex-1">
                    <NavItem id="leads" label="Lead Monitor" icon={LayoutDashboard} active={activeTab === 'leads'} onClick={setActiveTab} />
                    <NavItem id="conversations" label="Conversations" icon={MessageSquare} active={activeTab === 'conversations'} onClick={setActiveTab} />
                    <NavItem id="health" label="System Stats" icon={Activity} active={activeTab === 'health'} onClick={setActiveTab} />
                </nav>

                <div className="pt-6 border-t border-slate-700/50 space-y-3">
                    <NavItem id="settings" label="Config" icon={Settings} active={activeTab === 'settings'} onClick={setActiveTab} />
                    <div className="bg-slate-800/50 rounded-2xl p-4 mt-4 border border-slate-700/30">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Node Status</p>
                        <div className="flex items-center text-xs text-slate-300">
                            <div className="w-2 h-2 rounded-full bg-green-500 mr-2 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse"></div>
                            Active • r/fortechies
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="ml-72 p-10 min-h-screen bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#0f172a]">
                <div className="max-w-6xl mx-auto">
                    <header className="mb-12 flex justify-between items-end">
                        <div>
                            <div className="text-sky-400 text-xs font-bold uppercase tracking-widest mb-2 opacity-80">Command Center</div>
                            <h2 className="text-5xl font-extrabold text-white tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500">
                                {activeTab === 'leads' && 'Discovery'}
                                {activeTab === 'conversations' && 'Intelligence'}
                                {activeTab === 'health' && 'System Analytics'}
                                {activeTab === 'settings' && 'Global Config'}
                            </h2>
                        </div>
                        <div className="flex gap-4">
                            <div className="glass-card px-5 py-3 rounded-2xl flex items-center">
                                <div className="mr-4 text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Session Rate</p>
                                    <p className="text-xl font-bold text-white tracking-wide">98.4%</p>
                                </div>
                                <div className="w-1 bg-sky-500/30 h-8 rounded-full"></div>
                            </div>
                        </div>
                    </header>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        {activeTab === 'leads' && <LeadViewer />}
                        {activeTab === 'conversations' && <ConversationManager />}
                        {activeTab === 'health' && <SystemHealth />}
                        {activeTab === 'settings' && <SettingsManager />}
                    </div>
                </div>
            </main>
        </div>
    );
};

const NavItem = ({ id, label, icon: Icon, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center px-5 py-4 rounded-2xl transition-all duration-300 group relative ${active
            ? 'nav-active'
            : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
            }`}
    >
        <Icon className={`w-5 h-5 mr-4 transition-all duration-300 ${active ? 'text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="font-semibold tracking-wide text-sm">{label}</span>
        {!active && <div className="absolute inset-0 bg-sky-400/0 group-hover:bg-sky-400/5 transition-all duration-300 rounded-2xl"></div>}
    </button>
);


export default Dashboard;
