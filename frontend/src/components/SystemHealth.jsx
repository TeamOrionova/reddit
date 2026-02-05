import React, { useEffect, useState } from 'react';
import { getLogs } from '../api';
import { Activity, Server, AlertCircle, CheckCircle, Database } from 'lucide-react';

const SystemHealth = () => {
    const [logs, setLogs] = useState([]);

    // Mock status for now
    const status = {
        monitor: true,
        scheduler: true,
        database: true
    };

    const fetchLogs = async () => {
        try {
            const res = await getLogs();
            setLogs(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 10000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatusCard title="Reddit Monitor" active={status.monitor} icon={Activity} />
                <StatusCard title="Post Scheduler" active={status.scheduler} icon={Server} />
                <StatusCard title="Database" active={status.database} icon={Database} />
            </div>

            <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-2 text-yellow-500" />
                    System Logs
                </h3>
                <div className="bg-black/30 rounded-lg p-4 h-[250px] overflow-y-auto font-mono text-xs text-gray-400 space-y-1 custom-scrollbar">
                    {logs.length === 0 ? (
                        <div className="text-gray-600 italic text-center mt-10">No logs available.</div>
                    ) : (
                        logs.map(log => (
                            <div key={log.id} className="border-b border-white/5 pb-1 mb-1 last:border-0 flex">
                                <span className="text-gray-500 w-20 shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                <span className={`w-16 font-bold shrink-0 ${log.level === 'ERROR' ? 'text-red-500' : 'text-blue-400'}`}>{log.level}</span>
                                <span className="text-gray-300 w-24 shrink-0">[{log.module}]</span>
                                <span className="text-gray-400 break-all">{log.message}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const StatusCard = ({ title, active, icon: Icon }) => (
    <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 flex items-center justify-between shadow-md">
        <div className="flex items-center">
            <div className={`p-2 rounded-lg ${active ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'} mr-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-200">{title}</span>
        </div>
        <div className="flex items-center bg-black/20 px-2 py-1 rounded-full">
            <span className={`w-2 h-2 rounded-full mr-2 ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
            <span className={`text-[10px] font-bold tracking-wider ${active ? 'text-green-500' : 'text-red-500'}`}>{active ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
    </div>
);

export default SystemHealth;
