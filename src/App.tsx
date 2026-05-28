import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import TeacherView from './components/TeacherView';
import StudentView from './components/StudentView';
import { Student } from './types';
import { ShieldCheck, Plus, GraduationCap, Loader2 } from 'lucide-react';

export default function App() {
  const [session, setSession] = useState<{ role: 'teacher' | 'student'; payload: any } | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial student records from full-stack REST API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (err) {
      console.error("Failed to load student registers starting up", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync edits recursively down to db.json storage
  const handleUpdateStudents = async (updatedList: Student[]) => {
    // Optimistic UI updates
    setStudents(updatedList);
    
    // Update target session data if currently logged in student is updated
    if (session && session.role === 'student') {
      const match = updatedList.find(s => s.id === session.payload.id);
      if (match) {
        setSession({
          role: 'student',
          payload: match
        });
      }
    }

    try {
      await fetch('/api/students', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-email': session ? session.payload.email : 'System'
        },
        body: JSON.stringify(updatedList)
      });
    } catch (err) {
      console.error("Failed to save and sync grade book updates server-side", err);
    }
  };

  const handleLoginSuccess = (userSession: { role: 'teacher' | 'student'; payload: any }) => {
    setSession(userSession);
  };

  const handleLogout = () => {
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        <span className="text-xs">Initializing Rajarshi student records...</span>
      </div>
    );
  }

  // Not logged in -> Show portal gatekeeper login screen
  if (!session) {
    return <AuthScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Teacher portal view active
  if (session.role === 'teacher') {
    return (
      <TeacherView
        teacherData={session.payload}
        students={students}
        onUpdateStudents={handleUpdateStudents}
        onLogout={handleLogout}
      />
    );
  }

  // Parent / Student dashboard view active
  if (session.role === 'student') {
    return (
      <StudentView
        studentData={session.payload}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}
