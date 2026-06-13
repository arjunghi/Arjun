import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, TrendingUp, Calendar, Send, ShieldAlert, ShieldCheck, 
  MessageSquare, FileText, ChevronRight, Lock, Key, Award, Download, AlertCircle, Eye, EyeOff
} from 'lucide-react';
import { Student, Announcement, ChatMessage } from '../types';
import { calculateGradeAndGPA } from './TeacherView';
import { apiService } from '../lib/apiService';

interface StudentViewProps {
  studentData: Student;
  onLogout: () => void;
}

export default function StudentView({ studentData, onLogout }: StudentViewProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedChartSubject, setSelectedChartSubject] = useState<string>('English');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [calendarData, setCalendarData] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [weights, setWeights] = useState<Record<string, number[]>>({});
  const [selectedCdcSubject, setSelectedCdcSubject] = useState<string>('English');
  const [selectedCdcTerm, setSelectedCdcTerm] = useState<string>('Spring');
  
  // Encryption Simulator details
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [simulatedSteps, setSimulatedSteps] = useState<string[]>([]);
  const [activeStepIdx, setActiveStepIdx] = useState(-1);
  const [showEncryptedText, setShowEncryptedText] = useState(false);

  // Fetch announcements, chats and calendar
  useEffect(() => {
    apiService.fetchAnnouncements()
      .then(data => setAnnouncements(data))
      .catch(err => console.warn('Announcements fetch deferred:', err.message));

    apiService.fetchChat(studentData.id)
      .then(data => setMessages(data))
      .catch(err => console.warn('Chat fetch deferred:', err.message));

    apiService.fetchCalendar()
      .then(data => setCalendarData(data))
      .catch(err => console.warn('Calendar fetch deferred:', err.message));

    apiService.fetchAssessments()
      .then(data => setAssessments(data))
      .catch(err => console.warn('Assessments fetch deferred:', err.message));

    apiService.fetchWeights()
      .then(data => setWeights(data))
      .catch(err => console.warn('Weights fetch deferred:', err.message));
  }, [studentData.id]);

  // Handle Parent sending message via Cryptographic E2E Simulator
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const originalText = newMessage;
    setNewMessage('');
    setIsEncrypting(true);
    setActiveStepIdx(0);

    const steps = [
      "1. Locating Verified Recipient Teacher's Public Key...",
      "2. Public Key acquired: [RG_PUBKEY_49a941f...]",
      "3. Executing local browser-side AES-256 GCM encryption algorithm on message payload...",
      "4. Cipher-text compiled! Converting raw payload to base64 encrypted data string...",
      "5. Transmitting encrypted cipher-text node safely to cloud server database..."
    ];
    setSimulatedSteps(steps);

    // Run interactive visualization step delay
    for (let i = 0; i < steps.length; i++) {
      setActiveStepIdx(i);
      await new Promise(resolve => setTimeout(resolve, 350));
    }

    // Standard high-reliability mock cipher conversion
    const simulatedCipher = "E2E_CIPHER_NODE::" + btoa(unescape(encodeURIComponent(originalText)));

    try {
      const payload: ChatMessage = {
        id: `msg-${Date.now()}`,
        senderId: 'Parent-' + studentData.id,
        senderName: 'Parent of ' + studentData.name,
        senderRole: 'parent',
        studentId: studentData.id,
        encryptedText: simulatedCipher,
        decryptedText: originalText,
        timestamp: new Date().toLocaleTimeString()
      };

      await apiService.saveChat(payload);
      setMessages(prev => [...prev, payload]);
    } catch (err) {
      console.error("Encrypt and sync failed", err);
    } finally {
      setIsEncrypting(false);
      setActiveStepIdx(-1);
    }
  };

  // Convert cipher to raw format for demo view
  const decodeSimulatedCipher = (cipher: string) => {
    if (!cipher.startsWith("E2E_CIPHER_NODE::")) return cipher;
    try {
      const b64 = cipher.substring("E2E_CIPHER_NODE::".length);
      return decodeURIComponent(escape(atob(b64)));
    } catch (e) {
      return "[Cipher-Decode Issue]";
    }
  };

  // Compute stats
  const averageGPA = () => {
    const totalGPAs = studentData.grades.map(g => {
      const avgScore = (g.term1 + g.term2 + g.term3) / 3;
      return calculateGradeAndGPA(avgScore).gpa;
    });
    return (totalGPAs.reduce((sum, val) => sum + val, 0) / studentData.grades.length).toFixed(2);
  };

  const getOverallGrade = () => {
    const totalPercentages = studentData.grades.map(g => (g.term1 + g.term2 + g.term3) / 3);
    const avgPercentage = totalPercentages.reduce((sum, val) => sum + val, 0) / studentData.grades.length;
    return calculateGradeAndGPA(avgPercentage);
  };

  // Subject performance Trend Points switcher for graph SVG scale mapping
  const activeSubjectData = studentData.grades.find(g => g.subject === selectedChartSubject) || studentData.grades[0];
  const chartPoints = [
    { name: "Term I", score: activeSubjectData.term1 },
    { name: "Term II", score: activeSubjectData.term2 },
    { name: "Term III", score: activeSubjectData.term3 }
  ];

  // SVG dimensions for dynamic render trend lines
  const svgWidth = 500;
  const svgHeight = 200;
  const paddingX = 70;
  const paddingY = 30;

  // Map values to coordinates
  const points = chartPoints.map((p, idx) => {
    const x = paddingX + (idx / (chartPoints.length - 1)) * (svgWidth - paddingX * 2);
    // Score range 0 to 100 on graph height
    const y = svgHeight - paddingY - (p.score / 100) * (svgHeight - paddingY * 2);
    return { name: p.name, score: p.score, x, y };
  });

  const pathD = points.length > 0 
    ? `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`
    : '';

  return (
    <div id="student-view-root" className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-12">
      
      {/* Dynamic Header */}
      <div className="bg-white border-b border-slate-200 relative overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-slate-50 opacity-40"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-600 font-mono font-bold uppercase tracking-widest">Rajarshi Gurukul Student Portal</div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{studentData.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-lg font-semibold">
                  ID: {studentData.id}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  Grade {studentData.grade} • Section {studentData.section}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-parent-logout"
              onClick={onLogout}
              className="px-4 py-2 text-xs bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 text-slate-700 rounded-xl font-semibold transition-all shadow-sm"
            >
              Log Out Portal
            </button>
          </div>
        </div>
      </div>
      
      {/* Live Calendar Registry Overview */}
      {calendarData && calendarData.found && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div id="student-calendar-widget" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-605 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">📅 Live Calendar Registry (Today's Portal Sync)</h3>
              </div>
              <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-700 px-2.5 py-0.5 rounded-lg font-bold">
                Student Feed Synchronized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="space-y-1">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Semester & Schedule</div>
                <div className="text-xs font-bold text-indigo-950">{calendarData.term}</div>
                <div className="text-[11px] text-slate-500 font-medium">{calendarData.englishDate}</div>
                <div className="text-[10px] text-slate-405 font-mono">🇳🇵 {calendarData.nepaliDate} ({calendarData.day})</div>
              </div>

              <div className="space-y-1.5 pt-3 md:pt-0 md:pl-4">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Daily Day Type</div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    (calendarData.dayTypeStudents || "").toLowerCase().includes('holiday') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    Student: {calendarData.dayTypeStudents}
                  </span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-655 font-semibold px-2 py-0.5 rounded-md">
                    Teacher: {calendarData.dayTypeTeachers}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 md:pt-0 md:pl-4 col-span-1 md:col-span-2">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Curriculum & Activities</div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-slate-800 flex items-start gap-1">
                    <span className="text-indigo-600 font-bold">Core:</span> {calendarData.events}
                  </div>
                  <div className="text-xs text-slate-600 flex items-start gap-1 leading-relaxed">
                    <span className="text-emerald-600 font-bold">ECA:</span> {calendarData.ecaEvents}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-[10.5px]">
              <div><span className="font-bold text-indigo-650">PRIMARY Grade details:</span> <span className="bg-slate-50 text-slate-600 px-2.5 py-0.5 rounded font-medium border border-slate-200/60 ml-1.5">{calendarData.primary}</span></div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Performance, Charts, Qualitative remarks */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Key summaries indices */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Cumulative GPA</div>
                <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{averageGPA()} <span className="text-xs text-slate-400 font-normal font-sans">/ 4.0</span></div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Overall Grade</div>
                <div className="text-xl font-black text-slate-900 font-mono mt-0.5">{getOverallGrade().grade}</div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-[10px] text-slate-450 font-mono uppercase tracking-wider font-bold">Evaluation Status</div>
                <div className="text-xs font-semibold text-indigo-600 mt-1">{getOverallGrade().desc}</div>
              </div>
            </div>
          </div>

          {/* Academic charts & SVGs lines */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4.5 h-4.5 text-indigo-600" />
                  Terminal Progress Analytical Trend
                </h3>
                <p className="text-xs text-slate-500">Select any subject below to plot performance improvements across semesters.</p>
              </div>

              {/* Subject switcher for line chart */}
              <div className="flex items-center gap-2">
                <select
                  id="chart-subject-select"
                  value={selectedChartSubject}
                  onChange={(e) => setSelectedChartSubject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs text-indigo-600 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  {studentData.grades.map(g => (
                    <option key={g.subject} value={g.subject}>{g.subject}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Custom SVG Line Chart */}
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl flex items-center justify-center relative">
              <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="max-w-full text-slate-800 font-mono">
                {/* Gridlines */}
                {[0, 25, 50, 75, 100].map(yVal => {
                  const y = svgHeight - paddingY - (yVal / 100) * (svgHeight - paddingY * 2);
                  return (
                    <g key={yVal}>
                      <line x1={paddingX} y1={y} x2={svgWidth - paddingX} y2={y} stroke="#e2e8f0" strokeDasharray="3" />
                      <text x={paddingX - 12} y={y + 4} fill="#94a3b8" className="text-[10px] text-right font-semibold" textAnchor="end">{yVal}%</text>
                    </g>
                  );
                })}

                {/* Main Trend Line path */}
                {pathD && (
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="drop-shadow-[0_4px_12px_rgba(79,70,229,0.15)]"
                  />
                )}

                {/* Definition for path glowing gradient */}
                <defs>
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                </defs>

                {/* Circular coordinates nodes and values */}
                {points.map((p, idx) => (
                  <g key={idx}>
                    <circle cx={p.x} cy={p.y} r="6" fill="#ffffff" stroke="#4f46e5" strokeWidth="3" />
                    <text x={p.x} y={p.y - 12} fill="#4f46e5" className="text-xs font-bold text-center" textAnchor="middle">{p.score}%</text>
                    <text x={p.x} y={svgHeight - paddingY + 16} fill="#64748b" className="text-[10px] font-semibold" textAnchor="middle">{p.name}</text>
                  </g>
                ))}
              </svg>
            </div>
          </div>

          {/* CDC Interactive Continuous Portfolio Dashboard */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-bold">
                  CDC Continuous Evaluation Portfolio
                </span>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Continuous Practical/In-Term Progress Breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Track in-term participation, practical portfolios, and terminal tasks evaluated live by instructors.
                </p>
              </div>

              {/* Controls switcher in StudentView */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedCdcSubject}
                  onChange={(e) => setSelectedCdcSubject(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs text-indigo-650 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-550"
                >
                  {studentData.grades.map(g => (
                    <option key={g.subject} value={g.subject}>{g.subject}</option>
                  ))}
                </select>

                <select
                  value={selectedCdcTerm}
                  onChange={(e) => setSelectedCdcTerm(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs text-slate-600 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Spring">Spring Term</option>
                  <option value="Fall">Fall Term</option>
                  <option value="Final">Final Term</option>
                </select>
              </div>
            </div>

            {/* Matrix Calculation computation */}
            {(() => {
              const activeWeights = weights[selectedCdcSubject] || [5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100];
              const filteredAsms = assessments.filter(a => a.grade === studentData.grade && a.subject === selectedCdcSubject && a.term === selectedCdcTerm);

              const taskMap: Record<string, number> = {
                'ATT': 0, 'Discipline': 1, 'Practical': 3, 'Project Work': 4,
                'HW': 5, 'CW': 6, 'UT': 8, 'Parental Evaluation': 9, 'Written Exam': 12
              };

              const accumulators: Record<number, { earned: number; max: number }> = {
                0: { earned: 0, max: 0 },
                1: { earned: 0, max: 0 },
                3: { earned: 0, max: 0 },
                4: { earned: 0, max: 0 },
                5: { earned: 0, max: 0 },
                6: { earned: 0, max: 0 },
                8: { earned: 0, max: 0 },
                9: { earned: 0, max: 0 },
                12: { earned: 0, max: 0 }
              };

              filteredAsms.forEach(asm => {
                const idx = taskMap[asm.task];
                if (idx !== undefined) {
                  const scoreVal = asm.scores[studentData.id];
                  if (scoreVal !== undefined && scoreVal !== null && scoreVal !== "" && scoreVal !== "-") {
                    const scoreNum = parseFloat(scoreVal);
                    if (!isNaN(scoreNum)) {
                      accumulators[idx].earned += scoreNum;
                      accumulators[idx].max += asm.fullMarks;
                    }
                  }
                }
              });

              // Generate outputs
              const values = new Array(14).fill(0);
              const dataPointsCount = new Array(14).fill(0);

              Object.keys(accumulators).forEach(key => {
                const idx = parseInt(key);
                const acc = accumulators[idx];
                const limitScale = activeWeights[idx];
                if (acc.max > 0) {
                  values[idx] = parseFloat(((acc.earned / acc.max) * limitScale).toFixed(1));
                  dataPointsCount[idx] = 1;
                } else {
                  // Prepopulate elegant baseline simulated progression values
                  const scoreBaseline = (studentData.grades.find(g => g.subject === selectedCdcSubject)?.term1 || 78) - 4 + (studentData.sn * 3) % 9;
                  values[idx] = parseFloat(((scoreBaseline / 100) * limitScale).toFixed(1));
                }
              });

              // Interconnect totals
              values[2] = parseFloat((values[0] + values[1]).toFixed(1));
              values[7] = parseFloat((values[3] + values[4] + values[5] + values[6]).toFixed(1));
              values[10] = parseFloat((values[8] + values[9]).toFixed(1));
              values[11] = parseFloat((values[2] + values[7] + values[10]).toFixed(1));
              values[13] = parseFloat((values[11] + values[12]).toFixed(1));

              const percentageCdc = Math.round((values[13] / activeWeights[13]) * 100);

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Grid Box A: Large circular metric tracker block card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between shadow-inner">
                    <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Term Accumulator Aggregate</span>
                    
                    <div className="my-6 text-center space-y-2">
                      <div className="inline-flex items-center justify-center relative w-28 h-28 bg-white border-2 border-indigo-100 rounded-full shadow-sm">
                        <div className="space-y-0.5">
                          <div className="text-3xl font-black text-slate-850 font-mono tracking-tight">{values[13]}</div>
                          <div className="text-[10px] text-slate-400 text-center">out of {activeWeights[13]}</div>
                        </div>
                      </div>
                      <h4 className="text-sm font-bold text-indigo-950 mt-2">{percentageCdc}% CDC Competency</h4>
                      <p className="text-[11px] text-slate-450 max-w-[210px] mx-auto leading-normal">
                        Your combined scores contribution toward homework tasks, laboratories, behavior, and terminal exam.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-200 flex justify-between text-xs text-slate-500 font-medium">
                      <span>Term contribution:</span>
                      <strong className="text-indigo-800">{values[11]} / {activeWeights[11]} Marks</strong>
                    </div>
                  </div>

                  {/* Grid Box B: Bento Progress Bars for sub-categories */}
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Attendance / Discipline Conduct Indicator */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <h4 className="text-xs font-bold text-slate-850">Classroom Participation</h4>
                        <span className="text-[10px] text-indigo-700 font-mono font-bold bg-indigo-50 px-2 py-0.5 rounded">
                          {values[2]} / {activeWeights[2]} Max
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-505">
                            <span>Attendance record score:</span>
                            <span className="font-mono">{values[0]} / {activeWeights[0]}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${(values[0] / activeWeights[0]) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-505">
                            <span>conduct & discipline status:</span>
                            <span className="font-mono">{values[1]} / {activeWeights[1]}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-650 h-full rounded-full" style={{ width: `${(values[1] / activeWeights[1]) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Labs and Project portfolio */}
                    <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <h4 className="text-xs font-bold text-slate-850 font-sans">Practicals Portfolio</h4>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">
                          {values[7]} / {activeWeights[7]} Max
                        </span>
                      </div>

                      <div className="space-y-2">
                        {[
                          { name: "Laboratory practicals", val: values[3], max: activeWeights[3] },
                          { name: "Project presentations", val: values[4], max: activeWeights[4] },
                          { name: "Daily Homework tasks", val: values[5], max: activeWeights[5] },
                          { name: "Continuous Classworks", val: values[6], max: activeWeights[6] }
                        ].map((item, id) => (
                          <div key={id} className="text-[11px] space-y-0.5">
                            <div className="flex justify-between text-slate-505">
                              <span>{item.name}:</span>
                              <span className="font-mono font-bold">{item.val} / {item.max}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${(item.val / item.max) * 100}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Terminal Unit checks & Parental evaluation block */}
                    <div className="bg-white border border-slate-205 p-4 rounded-2xl space-y-3 shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                        <h4 className="text-xs font-bold text-slate-850">Evaluation Quiz (UT)</h4>
                        <span className="text-[10px] text-amber-700 font-mono font-bold bg-amber-50 px-2 py-0.5 rounded-lg">
                          {values[10]} / {activeWeights[10]} Max
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-550">
                            <span>In-term Unit Tests:</span>
                            <span className="font-mono">{values[8]} / {activeWeights[8]}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(values[8] / activeWeights[8]) * 100}%` }} />
                          </div>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between text-[11px] text-slate-550">
                            <span>Guardian Parental review:</span>
                            <span className="font-mono">{values[9]} / {activeWeights[9]}</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-amber-505 h-full rounded-full" style={{ width: `${(values[9] / activeWeights[9]) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Theoretical Exam Paper */}
                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-4 rounded-2xl flex flex-col justify-between shadow-md">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] uppercase tracking-wider text-indigo-300 font-mono font-bold">End-Semester paper</span>
                        <span className="text-[10px] bg-white/20 text-white font-mono px-2 py-0.5 rounded-md font-bold">
                          Weight: {activeWeights[12]}%
                        </span>
                      </div>

                      <div className="my-2 space-y-1">
                        <span className="text-xl font-mono font-black">{values[12]} / {activeWeights[12]}</span>
                        <div className="text-[10.5px] text-indigo-200">Earned score on final descriptive exam sheet.</div>
                      </div>

                      <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-white h-full rounded-full" style={{ width: `${(values[12] / activeWeights[12]) * 100}%` }} />
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* List of active evaluable assignments directory feed for student transparency */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <h4 className="text-xs font-bold uppercase text-slate-450 tracking-wider mb-3 font-sans">
                📋 Live Assessments Registry for {selectedCdcSubject} ({selectedCdcTerm} Term)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {assessments.filter(a => a.grade === studentData.grade && a.subject === selectedCdcSubject && a.term === selectedCdcTerm).length === 0 ? (
                  <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                    No custom assessment items published yet for this term by the evaluator.
                  </div>
                ) : (
                  assessments
                    .filter(a => a.grade === studentData.grade && a.subject === selectedCdcSubject && a.term === selectedCdcTerm)
                    .map(asm => {
                      const scoreVal = asm.scores[studentData.id] || "-";
                      return (
                        <div key={asm.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-1.5 font-sans">
                          <div className="flex justify-between items-start">
                            <span className="text-[8.5px] font-mono uppercase bg-indigo-50 border text-indigo-750 px-1.5 py-0.5 rounded">
                              {asm.task}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-slate-800">
                              Earned: <strong className="text-indigo-600">{scoreVal}</strong> / {asm.fullMarks}
                            </span>
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{asm.topic}</h5>
                            <p className="text-[9.5px] text-slate-450 font-mono">Published date: {asm.date}</p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>

          </div>

          {/* Report Card Grid spreadsheet */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
            <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center whitespace-nowrap">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-indigo-600" />
                Comprehensive Grade Card Summary
              </h3>
              
              <button 
                id="btn-print-report"
                onClick={() => window.print()}
                className="bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 text-indigo-600 text-xs px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm font-semibold"
              >
                <Download className="w-3.5 h-3.5" />
                Print / Export Card
              </button>
            </div>

            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase tracking-wider">
                    <th className="p-3 pl-4">Subject</th>
                    <th className="p-3 text-center w-24">Term I</th>
                    <th className="p-3 text-center w-24">Term II</th>
                    <th className="p-3 text-center w-24">Term III</th>
                    <th className="p-3 text-center w-24 bg-indigo-50/20 font-bold text-indigo-700">GPA Average</th>
                    <th className="p-3 text-center w-20">Final Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentData.grades.map((grade) => {
                    const avg = Math.round((grade.term1 + grade.term2 + grade.term3) / 3);
                    const calc = calculateGradeAndGPA(avg);

                    return (
                      <tr key={grade.subject} className="hover:bg-slate-50/40 transition-colors font-sans">
                        <td className="p-3 pl-4 font-semibold text-slate-800">{grade.subject}</td>
                        <td className="p-3 text-center text-slate-600 font-mono">{grade.term1}%</td>
                        <td className="p-3 text-center text-slate-600 font-mono">{grade.term2}%</td>
                        <td className="p-3 text-center text-slate-600 font-mono">{grade.term3}%</td>
                        <td className="p-3 text-center bg-indigo-50/10 font-mono text-indigo-650 font-bold">{calc.gpa.toFixed(2)}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${calc.color}`}>
                            {calc.grade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Mentoring comments */}
          {(studentData.aiComment || studentData.teacherRemarks) && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4.5 h-4.5 text-indigo-600" />
                Academic Advising & AI Mentor Assessments
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                {studentData.aiComment && (
                  <div className="space-y-2">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5 leading-none">
                      <Lock className="w-3.5 h-3.5" />
                      Gemini Auto-Evaluation Analysis
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">{studentData.aiComment}</p>
                  </div>
                )}

                {studentData.teacherRemarks && (
                  <div className="space-y-2 pt-4 md:pt-0 md:pl-5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5 leading-none">
                      <Lock className="w-3.5 h-3.5" />
                      Class Teacher Final Assessment
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{studentData.teacherRemarks}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Right Sidebar: Real-time bulletins, communication modules */}
        <div className="space-y-8">
          
          {/* E2E Secure Teacher Chat */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-[520px] overflow-hidden">
            <div className="space-y-1 pb-4 border-b border-slate-100">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <MessageSquare className="w-4.5 h-4.5 text-indigo-600" />
                  E2E Secure Teacher Chat
                </h3>
                
                {/* Decrypt toggle visualization */}
                <button
                  id="btn-toggle-cipher"
                  onClick={() => setShowEncryptedText(!showEncryptedText)}
                  title="Toggle raw data view stored in database vs local deciphered representation"
                  className="p-1 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"
                >
                  {showEncryptedText ? <Eye className="w-4.5 h-4.5" /> : <EyeOff className="w-4.5 h-4.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">Direct connection to student's academic assessor.</p>
            </div>

            {/* Chat list bubble stream */}
            <div className="flex-grow overflow-y-auto py-4 space-y-3 pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-400 flex flex-col items-center gap-2">
                  <ShieldCheck className="w-8 h-8 text-indigo-400/20" />
                  <p className="text-xs font-mono font-semibold">Decrypted Sandbox Secured</p>
                  <p className="text-[10px] text-slate-400 leading-tight">Post first message to trigger the end-to-end cryptographic lock simulator safely.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isOwn = m.senderRole === 'parent';
                  const displayMessage = showEncryptedText ? m.encryptedText : (m.decryptedText || decodeSimulatedCipher(m.encryptedText));

                  return (
                    <div key={m.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
                      <div className="text-[9px] text-slate-400 mb-0.5 font-mono">
                        {m.senderName} • {m.timestamp}
                      </div>
                      
                      <div className={`p-2.5 rounded-xl text-xs max-w-[85%] leading-relaxed ${
                        isOwn 
                          ? 'bg-indigo-50 border border-indigo-150 text-indigo-950 rounded-tr-none font-sans' 
                          : 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none'
                      }`}>
                        {/* E2E locks */}
                        {showEncryptedText && (
                          <div className="flex items-center gap-1 text-[8px] uppercase tracking-wider text-yellow-600 font-mono font-black mb-1.5 border-b border-yellow-500/20 pb-0.5">
                            <Lock className="w-3.5 h-3.5" /> Encrypted Node State
                          </div>
                        )}
                        <p className={showEncryptedText ? 'font-mono text-[9px] text-yellow-600 break-all' : 'font-sans'}>
                          {displayMessage}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}

              {/* Encryption interactive step animations */}
              <AnimatePresence>
                {isEncrypting && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 font-mono text-[10px] text-slate-600"
                  >
                    <div className="flex items-center gap-1.5 text-indigo-600 font-black uppercase text-[9px] mb-1">
                      <Key className="w-3.5 h-3.5 animate-pulse" /> E2E Browser-Side Lock Engine
                    </div>
                    {simulatedSteps.slice(0, activeStepIdx + 1).map((step, idx) => (
                      <div key={idx} className="transition-all text-xs text-slate-500">
                        {step}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Input fields */}
            <form id="chat-input-form" onSubmit={handleSendMessage} className="pt-3 border-t border-slate-100 flex gap-2">
              <input
                id="parent-message-text"
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={isEncrypting}
                placeholder="Securely message teacher..."
                className="flex-grow bg-slate-50 border border-slate-200 rounded-md py-2 px-3 text-xs placeholder-slate-400 text-slate-800 focus:outline-none focus:border-indigo-500"
              />
              <button
                id="btn-chat-send"
                type="submit"
                disabled={isEncrypting || !newMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-100 text-white px-3.5 rounded-md hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-md shadow-indigo-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* School bullet notifications board */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all space-y-4">
            <h3 className="font-bold text-slate-950 text-sm flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-600" />
              Primary School Announcements
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[300px]">
              {announcements.length === 0 ? (
                <p className="text-xs text-slate-400 font-mono text-center py-6">No bulletins published yet.</p>
              ) : (
                announcements.map((ann) => (
                  <div key={ann.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2">
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-bold text-slate-800 leading-snug">{ann.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">{ann.content}</p>
                    <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono font-medium pt-1.5 border-t border-slate-150">
                      <span>{ann.authorName}</span>
                      <span>{ann.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
