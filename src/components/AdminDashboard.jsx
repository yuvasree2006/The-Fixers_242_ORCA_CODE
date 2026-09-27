import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Radio,
  MapPin,
  LifeBuoy,
  User,
  Shield,
  Layers,
  ChevronDown
} from 'lucide-react';
import { authService } from '../services/authService';

export default function AdminDashboard({ currentUser, onLogout }) {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    // Auto refresh every 10 seconds for real-time incident tracking
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (reportId, newStatus) => {
    setUpdatingId(reportId);
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) =>
          prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Status update failed:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const highSeverityReports = reports.filter((r) => r.severity === 'HIGH');
  const medicalReportsCount = reports.filter((r) => r.report_type === 'Medical').length;
  const openReportsCount = reports.filter((r) => r.status === 'Open').length;
  const acknowledgedCount = reports.filter((r) => r.status === 'Acknowledged').length;
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length;

  const filteredReports = reports.filter((r) => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSeverity = severityFilter === 'all' || r.severity === severityFilter;
    const matchType = typeFilter === 'all' || (r.report_type || 'Distress') === typeFilter;
    const matchSearch =
      r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.report_type || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.notes || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchStatus && matchSeverity && matchType && matchSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-ocean-950 text-slate-100 font-sans selection:bg-rose-500 selection:text-white">
      {/* Admin Dedicated Navigation Top Bar */}
      <header className="bg-ocean-900/90 border-b border-rose-500/30 backdrop-blur-md px-6 py-3.5 sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-lg shadow-rose-500/20 ring-1 ring-rose-400/40">
            <ShieldAlert className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-lg text-slate-100 tracking-tight">
                ORCA Command Center
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-500/40 uppercase">
                Admin Operations
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Coast Guard & Port Incident Response Reporting System
            </p>
          </div>
        </div>

        {/* Admin User Profile & Standalone Logout Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-xs font-semibold transition-all"
            title="Refresh Incident Reports"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-100 leading-none">
                {currentUser?.name || 'Administrator'}
              </span>
              <span className="text-[10px] text-rose-300 truncate max-w-[140px]">
                {currentUser?.email || 'admin@orca.demo'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-sm group"
            title="Logout from Admin Portal"
          >
            <LogOut className="w-4 h-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* KPI Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-slate-100">{reports.length}</div>
              <div className="text-xs text-slate-400 mt-0.5">Total Incidents</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-rose-400">{highSeverityReports.length}</div>
              <div className="text-xs text-rose-300 mt-0.5">High Severity (SOS)</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-purple-500/30 bg-purple-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-purple-400">{medicalReportsCount}</div>
              <div className="text-xs text-purple-300 mt-0.5">Medical Triage</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Radio className="w-5 h-5 text-purple-400" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-amber-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-amber-400">{openReportsCount}</div>
              <div className="text-xs text-amber-300 mt-0.5">Open & Dispatched</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between">
            <div>
              <div className="text-2xl font-black text-emerald-400">{resolvedCount}</div>
              <div className="text-xs text-emerald-300 mt-0.5">Resolved / Rescued</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* URGENT ALERTS SUMMARY PANEL (HIGH SEVERITY ONLY) */}
        {highSeverityReports.length > 0 && (
          <div className="glass-panel p-5 rounded-3xl border-2 border-rose-500/60 bg-gradient-to-br from-rose-950/40 via-ocean-900 to-ocean-950 shadow-2xl space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-rose-500/30 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm sm:text-base">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                <span>🚨 URGENT ALERTS & RESCUE DISPATCH ({highSeverityReports.length})</span>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-500 text-white animate-pulse">
                ACTION REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {highSeverityReports.map((report) => (
                <div
                  key={report.id}
                  className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/40 space-y-2 relative overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${
                        report.report_type === 'Medical'
                          ? 'bg-purple-950 text-purple-300 border-purple-500/40'
                          : 'bg-rose-950 text-rose-300 border-rose-500/40'
                      }`}>
                        {report.report_type || 'Distress'}
                      </span>
                      <span className="font-bold text-xs text-rose-200 truncate">{report.role}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="text-xs text-slate-200">
                    <div className="font-semibold text-rose-300 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{report.location}</span>
                    </div>
                    {report.report_type !== 'Medical' ? (
                      <>
                        <div className="text-[11px] text-slate-300 mt-1">
                          💧 Water: <strong className="text-rose-400">{report.water_status}</strong>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          🍞 Food: <strong className="text-amber-300">{report.food_status}</strong>
                        </div>
                      </>
                    ) : (
                      <div className="text-[11px] text-purple-300 mt-1">
                        🏥 Medical Incident Notes: <span className="text-slate-200">{report.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-rose-500/20 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">
                      STATUS: {report.status}
                    </span>
                    <select
                      value={report.status}
                      disabled={updatingId === report.id}
                      onChange={(e) => handleStatusChange(report.id, e.target.value)}
                      className="bg-ocean-900 border border-rose-500/40 rounded-lg px-2 py-0.5 text-[11px] text-slate-200 font-semibold cursor-pointer outline-none"
                    >
                      <option value="Open">Open</option>
                      <option value="Acknowledged">Acknowledged</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search Toolbar */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-ocean-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer"
              >
                <option value="all" className="bg-ocean-900">All Types</option>
                <option value="Distress" className="bg-ocean-900">Distress (Lost/Stranded)</option>
                <option value="Medical" className="bg-ocean-900">Medical Emergencies</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-ocean-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer"
              >
                <option value="all" className="bg-ocean-900">All Statuses</option>
                <option value="Open" className="bg-ocean-900">Open</option>
                <option value="Acknowledged" className="bg-ocean-900">Acknowledged</option>
                <option value="Resolved" className="bg-ocean-900">Resolved</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-ocean-850 border border-slate-700 rounded-xl px-3 py-1.5 text-xs">
              <span className="text-slate-400 font-medium">Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold outline-none cursor-pointer"
              >
                <option value="all" className="bg-ocean-900">All Severities</option>
                <option value="HIGH" className="bg-ocean-900">HIGH (Urgent)</option>
                <option value="MEDIUM" className="bg-ocean-900">MEDIUM</option>
                <option value="LOW" className="bg-ocean-900">LOW</option>
              </select>
            </div>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search location, role, notes, type..."
              className="w-full bg-ocean-850 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-rose-400"
            />
          </div>
        </div>

        {/* Master Incident Reports Data Table */}
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-ocean-900/90 border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">ID & Time</th>
                  <th className="py-3.5 px-4">Report Type</th>
                  <th className="py-3.5 px-4">Reporting Role</th>
                  <th className="py-3.5 px-4">Location / Bay</th>
                  <th className="py-3.5 px-4">Food / Rations</th>
                  <th className="py-3.5 px-4">Water / Hydration</th>
                  <th className="py-3.5 px-4">Severity</th>
                  <th className="py-3.5 px-4">Status Action</th>
                  <th className="py-3.5 px-4">Incident Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredReports.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500">
                      No reports match the active filters or search query.
                    </td>
                  </tr>
                ) : (
                  filteredReports.map((report) => {
                    const isHigh = report.severity === 'HIGH';
                    const isMedical = report.report_type === 'Medical';
                    return (
                      <React.Fragment key={report.id}>
                        {/* High severity prominent red banner header above row */}
                        {isHigh && (
                          <tr className="bg-rose-600 text-white font-extrabold text-[10px] tracking-wider uppercase">
                            <td colSpan="9" className="py-1 px-4">
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                                <span>⚠ TAKE IMMEDIATE ACTION — HIGH SEVERITY {isMedical ? 'MEDICAL EMERGENCY' : 'DISTRESS INCIDENT'} #{report.id}</span>
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr
                          className={`hover:bg-ocean-850/60 transition-colors ${
                            isHigh ? 'bg-rose-950/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono text-slate-300">
                            <div>#{report.id}</div>
                            <div className="text-[10px] text-slate-500">
                              {new Date(report.timestamp).toLocaleString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase ${
                                isMedical
                                  ? 'bg-purple-950/90 text-purple-300 border-purple-500/40'
                                  : 'bg-cyan-950/90 text-cyan-300 border-cyan-500/40'
                              }`}
                            >
                              {report.report_type || 'Distress'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200">
                              {report.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-cyan-300 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>{report.location}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            {report.food_status || '—'}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300">
                            {report.water_status || '—'}
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                                isHigh
                                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                                  : report.severity === 'MEDIUM'
                                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                                  : 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                              }`}
                            >
                              {report.severity}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <select
                              value={report.status}
                              disabled={updatingId === report.id}
                              onChange={(e) => handleStatusChange(report.id, e.target.value)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
                                report.status === 'Open'
                                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                                  : report.status === 'Acknowledged'
                                  ? 'bg-amber-950/80 border-amber-500 text-amber-300'
                                  : 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                              }`}
                            >
                              <option value="Open" className="bg-ocean-900 text-rose-300">Open</option>
                              <option value="Acknowledged" className="bg-ocean-900 text-amber-300">Acknowledged</option>
                              <option value="Resolved" className="bg-ocean-900 text-emerald-300">Resolved</option>
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-slate-400 text-[11px] max-w-xs truncate">
                            {report.notes || '—'}
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
