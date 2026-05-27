import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, GraduationCap, Users, Mail, Key, Eye, EyeOff, Sparkles, Building } from 'lucide-react';

interface AuthScreenProps {
  onLoginSuccess: (user: { role: 'teacher' | 'student'; payload: any }) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [email, setEmail] = useState('arjun@rajarshigurukul.edu.np');
  const [password, setPassword] = useState('RG-Teacher-2026');
  const [studentId, setStudentId] = useState('G1-S1');
  const [pin, setPin] = useState('1001');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@rajarshigurukul.edu.np')) {
      setError('Access restricted to verified university/school emails ending with @rajarshigurukul.edu.np');
      return;
    }

    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const is_admin = email.toLowerCase() === 'arjun@rajarshigurukul.edu.np';
      onLoginSuccess({
        role: 'teacher',
        payload: {
          id: is_admin ? 'T-Admin' : 'T-101',
          name: email.split('@')[0].split('.').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' '),
          email: email.toLowerCase(),
          gradeResponsible: 1,
          sectionResponsible: 'Butterfly',
          role: is_admin ? 'admin' : 'teacher',
        }
      });
    }, 600);
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!studentId || !pin) {
      setError('Both Student ID and Parent PIN are required.');
      return;
    }

    setLoading(true);
    // Call server to fetch students list and crosscheck
    fetch('/api/students')
      .then(res => res.json())
      .then((students: any[]) => {
        setLoading(false);
        const match = students.find(
          s => s.id.toLowerCase() === studentId.trim().toLowerCase() && s.parentPin === pin.trim()
        );

        if (match) {
          onLoginSuccess({
            role: 'student',
            payload: match
          });
        } else {
          setError('Invalid Student ID or Parent security PIN. Note: Grade 1 student 1 is ID "G1-S1" and PIN "1001".');
        }
      })
      .catch(err => {
        setLoading(false);
        setError('Server authentication error. Please try again.');
      });
  };

  const handleMockGoogleLogin = () => {
    setError('');
    // Mock user login through actual admin user
    onLoginSuccess({
      role: 'teacher',
      payload: {
        id: 'T-Admin',
        name: 'Arjun Adhikari',
        email: 'arjun@rajarshigurukul.edu.np',
        gradeResponsible: 1,
        sectionResponsible: 'Bumble Bee',
        role: 'admin',
      }
    });
  };

  return (
    <div id="auth-container" className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-40"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="p-3 bg-indigo-50 border border-indigo-150 text-indigo-600 rounded-2xl w-14 h-14 mx-auto flex items-center justify-center mb-3 shadow-sm">
            <Building className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Rajarshi Gurukul</h1>
          <p className="text-xs text-slate-500 font-mono tracking-wider">COMPREHENSIVE STUDENT PORTAL</p>
        </div>

        {/* Tab Controls */}
        <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl mb-6">
          <button
            id="tab-teacher"
            onClick={() => { setActiveTab('teacher'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'teacher'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Teacher Portal
          </button>
          <button
            id="tab-student"
            onClick={() => { setActiveTab('student'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2 px-3 text-xs sm:text-sm font-semibold rounded-lg transition-all duration-200 ${
              activeTab === 'student'
                ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/60'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Student / Parent
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-xs rounded-xl mb-4 cursor-pointer font-medium"
            onClick={() => setError('')}
          >
            {error}
          </motion.div>
        )}

        {/* Teacher Authentication Form */}
        {activeTab === 'teacher' ? (
          <form id="teacher-form" onSubmit={handleTeacherSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Teacher academic Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="teacher-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans"
                  placeholder="e.g. teacher@rajarshigurukul.edu.np"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-slate-500 uppercase font-mono tracking-wider">Secure Password</label>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-10 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-sans"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-450 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="btn-teacher-login"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="text-slate-100">Signing in...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Access Teacher System
                </>
              )}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-400 font-mono uppercase bg-white px-2">OR SINGLE SIGN-ON</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <button
              id="btn-google-login"
              type="button"
              onClick={handleMockGoogleLogin}
              className="w-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all duration-200"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              Login securely with Google Workspace (@rajarshigurukul.edu.np)
            </button>
          </form>
        ) : (
          /* Student/Parent Authentication Form */
          <form id="student-form" onSubmit={handleStudentSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Assigned Student Registration ID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405">
                  <GraduationCap className="w-4 h-4" />
                </span>
                <input
                  id="student-id"
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-mono"
                  placeholder="e.g. G1-S1, G5-S1"
                />
              </div>
              <p className="text-[10px] text-slate-450 mt-1">Grade 1 registry includes G1-S1 through G1-S25</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Secret Parent Login PIN</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-405">
                  <Key className="w-4 h-4" />
                </span>
                <input
                  id="parent-pin"
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all tracking-widest font-mono"
                  placeholder="••••"
                />
              </div>
              <p className="text-[10px] text-slate-455 mt-1 font-sans">PIN format: 1000 + student serial number (e.g. 1001 for SN: 1)</p>
            </div>

            <button
              id="btn-student-login"
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="text-slate-100">Authorizing...</span>
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  View Progress Dashboard
                </>
              )}
            </button>
          </form>
        )}

        {/* Security / Encryption disclaimer */}
        <div className="mt-6 p-3 bg-slate-55/80 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
          <ShieldCheck className="w-4.5 h-4.5 text-indigo-600 flex-shrink-0 mt-0.5" />
          <div className="text-[10.5px] text-slate-500 leading-relaxed font-sans">
            <span className="font-bold text-slate-700">E2E Local-Browser Encryption Active</span>: Academic indices and messaging portals are structured through E2E simulated encryption keys prior to synchronization.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
