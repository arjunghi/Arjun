import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, BookOpen, GraduationCap, Sparkles, Send, CheckCircle2, 
  HelpCircle, RefreshCw, AlertCircle, FileSpreadsheet, Plus, Trash2, LogOut, ChevronRight,
  ShieldCheck, Settings, Layers, PlusCircle, Sparkle, Calendar, FileText, Printer, Download, Clipboard,
  Link, Link2, Share2, Globe, FileUp, Sparkle as Sparkicon, Loader2
} from 'lucide-react';
import { Student, SubjectGrade, Announcement, Assessment } from '../types';
import { initAuth, googleSignIn, googleLogout } from '../lib/firebaseAuth';

interface TeacherViewProps {
  teacherData: any;
  students: Student[];
  onUpdateStudents: (updated: Student[]) => Promise<void>;
  onLogout: () => void;
}

// GPA converter utility
export function calculateGradeAndGPA(percentage: number): { grade: string; gpa: number; color: string; desc: string } {
  if (percentage >= 90) return { grade: 'A+', gpa: 4.0, color: 'text-emerald-700 border-emerald-250 bg-emerald-50', desc: 'Outstanding' };
  if (percentage >= 80) return { grade: 'A', gpa: 3.6, color: 'text-green-700 border-green-250 bg-green-50', desc: 'Excellent' };
  if (percentage >= 70) return { grade: 'B+', gpa: 3.2, color: 'text-teal-700 border-teal-250 bg-teal-50', desc: 'Very Good' };
  if (percentage >= 60) return { grade: 'B', gpa: 2.8, color: 'text-indigo-700 border-indigo-250 bg-indigo-50', desc: 'Good' };
  if (percentage >= 50) return { grade: 'C+', gpa: 2.4, color: 'text-yellow-700 border-yellow-250 bg-yellow-50', desc: 'Satisfactory' };
  if (percentage >= 40) return { grade: 'C', gpa: 2.0, color: 'text-orange-700 border-orange-250 bg-orange-50', desc: 'Acceptable' };
  if (percentage >= 35) return { grade: 'D', gpa: 1.6, color: 'text-amber-700 border-amber-250 bg-amber-50', desc: 'Basic' };
  return { grade: 'NG', gpa: 0.0, color: 'text-red-700 border-red-250 bg-red-50', desc: 'Non-Graded' };
}

export default function TeacherView({ teacherData, students, onUpdateStudents, onLogout }: TeacherViewProps) {
  const [activeMenu, setActiveMenu] = useState<'gradebook' | 'ai-writer' | 'announcements' | 'admin' | 'cdc-sheets'>('gradebook');
  
  // Selection States
  const [selectedGrade, setSelectedGrade] = useState<number>(1);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('English');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // CDC state variables
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [weights, setWeights] = useState<Record<string, number[]>>({});
  const [calendarData, setCalendarData] = useState<any>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [cdcTermFilter, setCdcTermFilter] = useState<'Spring' | 'Fall' | 'Final' | 'All'>('Spring');
  const [cdcActiveTab, setCdcActiveTab] = useState<'entries' | 'gradesheet'>('gradesheet');
  
  // Custom column form variables
  const [isCdcEdit, setIsCdcEdit] = useState(false);
  const [activeCdcColId, setActiveCdcColId] = useState<string | null>(null);
  const [cdcFormTask, setCdcFormTask] = useState<'HW' | 'CW' | 'Practical' | 'Project Work' | 'UT' | 'ATT' | 'Discipline' | 'Parental Evaluation' | 'Written Exam'>('HW');
  const [cdcFormTerm, setCdcFormTerm] = useState<'Spring' | 'Fall' | 'Final'>('Spring');
  const [cdcFormTopic, setCdcFormTopic] = useState('');
  const [cdcFormFullMarks, setCdcFormFullMarks] = useState<number>(10);
  const [cdcFormDate, setCdcFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [cdcFormScores, setCdcFormScores] = useState<Record<string, string>>({});
  
  // Weight configurations state
  const [editWeights, setEditWeights] = useState<number[]>(new Array(14).fill(0));
  const [weightsSuccess, setWeightsSuccess] = useState('');
  const [weightsError, setWeightsError] = useState('');

  // Google Sheets integration state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [sheetError, setSheetError] = useState('');
  const [sheetSuccess, setSheetSuccess] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [importSpreadsheetId, setImportSpreadsheetId] = useState('');
  const [importRange, setImportRange] = useState('Sheet1!A1:Q50');
  const [importedLog, setImportedLog] = useState('');

  // Initial Data Loads
  React.useEffect(() => {
    fetchAssessments();
    fetchWeights();
    fetchCalendar();

    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const fetchAssessments = async () => {
    try {
      const res = await fetch('/api/assessments');
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      }
    } catch (e) {
      console.error("Failed to load assessments", e);
    }
  };

  const fetchWeights = async () => {
    try {
      const res = await fetch('/api/weights');
      if (res.ok) {
        const data = await res.json();
        setWeights(data);
        if (data[selectedSubject]) {
          setEditWeights(data[selectedSubject]);
        } else {
          setEditWeights([5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100]);
        }
      }
    } catch (e) {
      console.error("Failed to load weights", e);
    }
  };

  const fetchCalendar = async () => {
    try {
      setCalendarLoading(true);
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        setCalendarData(data);
      }
    } catch (e) {
      console.error("Failed to fetch calendar", e);
    } finally {
      setCalendarLoading(false);
    }
  };

  // Sync edited subject's active Weights Configuration locally
  React.useEffect(() => {
    if (weights[selectedSubject]) {
      setEditWeights(weights[selectedSubject]);
    } else {
      setEditWeights([5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100]);
    }
  }, [selectedSubject, weights]);

  // Google Auth Handlers
  const handleGoogleConnect = async () => {
    setIsSyncing(true);
    setSheetError('');
    setSheetSuccess('');
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setGoogleToken(result.accessToken);
        setSheetSuccess(`Successfully connected to secure Google account: ${result.user.email}`);
      }
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || 'Verification could not be processed.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    setIsSyncing(true);
    try {
      await googleLogout();
      setGoogleUser(null);
      setGoogleToken(null);
      setSheetSuccess('Logged out from Google account cleanly.');
    } catch (err: any) {
      setSheetError('Failed to disconnect cleanly.');
    } finally {
      setIsSyncing(false);
    }
  };

  const cdcRowsCalculatedForExportAndImport = (subjectName: string, termFilter: string) => {
    const filteredAsms = assessments.filter(a => {
      const matchGrade = a.grade === selectedGrade;
      const matchSubject = a.subject === subjectName;
      const matchTerm = termFilter === 'All' || a.term === termFilter;
      return matchGrade && matchSubject && matchTerm;
    });

    const activeWeights = weights[subjectName] || [5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100];
    
    const taskMap: Record<string, number> = {
      'ATT': 0, 'Discipline': 1, 'Practical': 3, 'Project Work': 4,
      'HW': 5, 'CW': 6, 'UT': 8, 'Parental Evaluation': 9, 'Written Exam': 12
    };

    const currentClassStudents = students.filter(s => s.grade === selectedGrade);

    return currentClassStudents.map((student) => {
      const calculatedScores = new Array(14).fill(0);
      const categoryHasData = new Array(14).fill(false);

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
          const rawScoreVal = asm.scores[student.id];
          if (rawScoreVal !== undefined && rawScoreVal !== null && rawScoreVal !== "" && rawScoreVal !== "-") {
            const scoreNum = parseFloat(rawScoreVal);
            if (!isNaN(scoreNum)) {
              accumulators[idx].earned += scoreNum;
              accumulators[idx].max += asm.fullMarks;
            }
          }
        }
      });

      Object.keys(accumulators).forEach(key => {
        const idx = parseInt(key);
        const acc = accumulators[idx];
        const maxAllowed = activeWeights[idx];
        if (acc.max > 0) {
          calculatedScores[idx] = parseFloat(((acc.earned / acc.max) * maxAllowed).toFixed(1));
          categoryHasData[idx] = true;
        } else {
          const studentVariance = -5 + (student.sn * 3 + subjectName.length) % 11;
          let defaultBaseline = (student.grades.find(g => g.subject === subjectName)?.term1 || 76) + studentVariance;
          defaultBaseline = Math.max(30, Math.min(100, defaultBaseline));
          calculatedScores[idx] = parseFloat(((defaultBaseline / 100) * maxAllowed).toFixed(1));
          categoryHasData[idx] = true;
        }
      });

      calculatedScores[2] = parseFloat((calculatedScores[0] + calculatedScores[1]).toFixed(1));
      categoryHasData[2] = categoryHasData[0] || categoryHasData[1];

      calculatedScores[7] = parseFloat((calculatedScores[3] + calculatedScores[4] + calculatedScores[5] + calculatedScores[6]).toFixed(1));
      categoryHasData[7] = categoryHasData[3] || categoryHasData[4] || categoryHasData[5] || categoryHasData[6];

      calculatedScores[10] = parseFloat((calculatedScores[8] + calculatedScores[9]).toFixed(1));
      categoryHasData[10] = categoryHasData[8] || categoryHasData[9];

      calculatedScores[11] = parseFloat((calculatedScores[2] + calculatedScores[7] + calculatedScores[10]).toFixed(1));
      categoryHasData[11] = categoryHasData[2] || categoryHasData[7] || categoryHasData[10];

      calculatedScores[13] = parseFloat((calculatedScores[11] + calculatedScores[12]).toFixed(1));
      categoryHasData[13] = categoryHasData[11] || categoryHasData[12];

      return {
        id: student.id,
        sn: student.sn,
        name: student.name,
        section: student.section,
        scoresArray: calculatedScores.map((val, idx) => categoryHasData[idx] ? val : "-")
      };
    });
  };

  const handleExportToGoogleSheets = async () => {
    if (!googleToken) {
      setSheetError("Please connect your Google Account first to authorize Sheets integration.");
      return;
    }
    setSheetError("");
    setSheetSuccess("");
    setIsSyncing(true);

    try {
      // 1. Create a spreadsheet
      const createRes = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          properties: {
            title: `Rajarshi Gurukul - Grade ${selectedGrade} ${selectedSubject} CDC Evaluation (${cdcTermFilter} Term)`
          }
        })
      });

      if (!createRes.ok) {
        const errorData = await createRes.json();
        throw new Error(errorData.error?.message || "Failed to create spreadsheet.");
      }

      const sheetData = await createRes.json();
      const spreadsheetId = sheetData.spreadsheetId;

      // 2. Prepare values
      const cdcRows = cdcRowsCalculatedForExportAndImport(selectedSubject, cdcTermFilter);
      const activeWeights = weights[selectedSubject] || [5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100];

      const values = [
        ["RAJARSHI GURUKUL SCHOOL - CENTRALIZED CURRICULUM CDC EVALUATION"],
        [`Grade Level: Grade ${selectedGrade} | Subject: ${selectedSubject} | Evaluation Term: ${cdcTermFilter} | Exported: ${new Date().toLocaleString()}`],
        [],
        [
          "S.N.", 
          "Student Name", 
          "Section", 
          `ATT (${activeWeights[0]})`, 
          `DISC (${activeWeights[1]})`, 
          `Conduct Total (${activeWeights[2]})`,
          `PRAC (${activeWeights[3]})`, 
          `PROJ (${activeWeights[4]})`, 
          `HW (${activeWeights[5]})`, 
          `CW (${activeWeights[6]})`, 
          `Practicals Portfolio (${activeWeights[7]})`,
          `Quiz UT (${activeWeights[8]})`, 
          `Parental Eval (${activeWeights[9]})`, 
          `Unit Evaluations (${activeWeights[10]})`,
          `In-Term Agg (${activeWeights[11]})`, 
          `Final Exam Paper (${activeWeights[12]})`, 
          `CDC Overall (${activeWeights[13]})`
        ]
      ];

      cdcRows.forEach((row) => {
        values.push([
          row.sn.toString(),
          row.name,
          row.section,
          ...row.scoresArray.map(v => v === undefined || v === null ? "-" : v.toString())
        ]);
      });

      // 3. Write data to sheet
      const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent("Sheet1!A1:Q" + values.length)}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${googleToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          range: "Sheet1!A1:Q" + values.length,
          majorDimension: "ROWS",
          values: values
        })
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(errorData.error?.message || "Failed to populate Spreadsheet.");
      }

      setSheetSuccess(`Successfully generated live Google Sheet! URL / SpreadID: ${spreadsheetId}`);
      setImportSpreadsheetId(spreadsheetId);
    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || "Unknown error creating/writing to spreadsheet.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportFromGoogleSheets = async () => {
    if (!googleToken) {
      setSheetError("Please connect your Google Account first.");
      return;
    }
    setSheetError("");
    setSheetSuccess("");
    setImportedLog("");
    setIsSyncing(true);

    try {
      let sheetId = importSpreadsheetId.trim();
      if (sheetId.startsWith("http")) {
        const match = sheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) sheetId = match[1];
      }

      if (!sheetId) {
        throw new Error("Please provide a valid Google Sheets Shared URL or Spreadsheet ID.");
      }

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(importRange)}`, {
        headers: { "Authorization": `Bearer ${googleToken}` }
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Spreadsheet fetch failed. Confirm your spreadsheet has public/shared access.");
      }

      const data = await res.json();
      if (!data.values || data.values.length === 0) {
        throw new Error("Empty rows / no sheets data returned under target range: " + importRange);
      }

      const values: string[][] = data.values;
      
      // Auto-matching logic for Students IDs/Names and Scores
      let headerRowIndex = -1;
      let studentIdCol = -1;
      let scoreCol = -1;

      for (let i = 0; i < Math.min(values.length, 10); i++) {
        const row = values[i];
        const hasId = row.findIndex(c => {
          const val = c?.toString().toLowerCase() || "";
          return val.includes("id") || val.includes("s.n.") || val.includes("sn") || val === "student" || val.includes("name");
        });
        const hasScore = row.findIndex(c => {
          const val = c?.toString().toLowerCase() || "";
          return val.includes("score") || val.includes("mark") || val.includes("term") || val.includes("exam") || val.includes("agg") || val.includes("att");
        });

        if (hasId !== -1 && hasScore !== -1) {
          headerRowIndex = i;
          studentIdCol = hasId;
          scoreCol = hasScore;
          break;
        }
      }

      if (studentIdCol === -1 || scoreCol === -1) {
        studentIdCol = 0;
        scoreCol = values[0]?.length > 1 ? values[0].length - 1 : 1; 
        headerRowIndex = 0;
      }

      const updatedStudents = [...students];
      let matchCount = 0;
      let logOutput = `Analyzing row-by-row columns at indices [ID: Col ${studentIdCol + 1}, Marks: Col ${scoreCol + 1}]:\n`;

      for (let i = headerRowIndex + 1; i < values.length; i++) {
        const row = values[i];
        if (row.length <= Math.max(studentIdCol, scoreCol)) continue;

        const cellId = row[studentIdCol]?.toString().trim();
        const cellScoreVal = row[scoreCol]?.toString().trim();

        if (!cellId) continue;

        const matchStudent = updatedStudents.find(
          s => s.id.toLowerCase() === cellId.toLowerCase() || s.name.toLowerCase() === cellId.toLowerCase()
        );

        if (matchStudent) {
          const subjGrade = matchStudent.grades.find(g => g.subject === selectedSubject);
          if (subjGrade && cellScoreVal) {
            const cleanScoreVal = cellScoreVal.replace(/%/g, '');
            const numScore = parseFloat(cleanScoreVal);
            if (!isNaN(numScore)) {
              if (cdcTermFilter === "Spring") subjGrade.term1 = Math.round(Math.min(100, Math.max(0, numScore)));
              else if (cdcTermFilter === "Fall") subjGrade.term2 = Math.round(Math.min(100, Math.max(0, numScore)));
              else subjGrade.term3 = Math.round(Math.min(100, Math.max(0, numScore)));
              
              matchCount++;
              logOutput += `✓ Mapped "${matchStudent.name}" (${matchStudent.id}) -> Set ${cdcTermFilter} evaluation to ${numScore}%\n`;
            }
          }
        }
      }

      if (matchCount > 0) {
        await onUpdateStudents(updatedStudents);
        setImportedLog(logOutput + `\n🎉 Successfully imported and synced ${matchCount} student scores into local system database!`);
      } else {
        setImportedLog(logOutput + `\n⚠️ No matching students or valid numeric scores found. Verify names and columns under the specified range.`);
      }

    } catch (err: any) {
      console.error(err);
      setSheetError(err.message || "Unknown error parsing/reading from spreadsheet.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle saving new column or editing scores
  const handleSaveCdcAssessment = async () => {
    if (!cdcFormTopic.trim()) {
      alert("Please specify a Column Topic or Homework/Activity Name.");
      return;
    }
    if (cdcFormFullMarks <= 0) {
      alert("Full Marks must be greater than zero.");
      return;
    }

    // Prepare complete record
    const record: Assessment = {
      id: activeCdcColId || `asm-${Date.now()}`,
      grade: selectedGrade,
      subject: selectedSubject,
      term: cdcFormTerm,
      date: cdcFormDate,
      topic: cdcFormTopic,
      task: cdcFormTask,
      fullMarks: cdcFormFullMarks,
      scores: cdcFormScores
    };

    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      if (res.ok) {
        await fetchAssessments();
        // Reset Form
        setIsCdcEdit(false);
        setActiveCdcColId(null);
        setCdcFormTopic('');
        setCdcFormFullMarks(10);
        setCdcFormScores({});
        alert("Evaluation column records synchronized successfully!");
      }
    } catch (e) {
      console.error("Failed to sync CDC column", e);
    }
  };

  const handleDeleteCdcCol = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this evaluation column record? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/assessments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchAssessments();
        alert("Record deleted.");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditCdcColInit = (asm: Assessment) => {
    setIsCdcEdit(true);
    setActiveCdcColId(asm.id);
    setCdcFormTask(asm.task);
    setCdcFormTerm(asm.term);
    setCdcFormTopic(asm.topic);
    setCdcFormFullMarks(asm.fullMarks);
    setCdcFormDate(asm.date);
    setCdcFormScores(asm.scores);
  };

  const handleSaveWeightsMatrix = async () => {
    try {
      const res = await fetch('/api/weights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: selectedSubject,
          weights: editWeights
        })
      });
      if (res.ok) {
        setWeightsSuccess("Subject CDC Scale Weights Configured Successfully!");
        setWeights(prev => ({
          ...prev,
          [selectedSubject]: editWeights
        }));
        setTimeout(() => setWeightsSuccess(''), 3000);
      }
    } catch (e) {
      setWeightsError("Internal network error.");
      setTimeout(() => setWeightsError(''), 3000);
    }
  };

  // Announcement states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [annSaving, setAnnSaving] = useState(false);
  const [annSuccess, setAnnSuccess] = useState(false);

  // Admin Portal state structures
  const [adminSubTab, setAdminSubTab] = useState<'students' | 'subjects' | 'overview'>('students');
  const [adminSelectGrade, setAdminSelectGrade] = useState<number>(1);
  
  // Student Creation
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentSection, setNewStudentSection] = useState('Butterfly');
  const [newStudentPin, setNewStudentPin] = useState('');

  // Student Edition
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingStudentName, setEditingStudentName] = useState('');
  const [editingStudentGrade, setEditingStudentGrade] = useState<number>(1);
  const [editingStudentSection, setEditingStudentSection] = useState('');
  const [editingStudentPin, setEditingStudentPin] = useState('');

  // Subject Creation
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCreditHours, setNewSubjectCreditHours] = useState<number>(4);

  // Status Alerts
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminError, setAdminError] = useState('');

  // Gemini state triggers
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiWarning, setAiWarning] = useState(false);

  // Filter students based on selection
  const filteredStudents = students.filter(s => {
    const matchGrade = s.grade === selectedGrade;
    const matchSection = selectedSection === 'all' || s.section === selectedSection;
    return matchGrade && matchSection;
  });

  // Ensure selected student matches filtered items or is resetted
  const currentStudentsInView = filteredStudents;
  const currentFocusStudent = students.find(s => s.id === selectedStudentId) || currentStudentsInView[0];

  // Subjects lists
  const availableSubjects = ['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'ICT'];

  // Handle grade change spreadsheet level
  const handleScoreChange = (studentId: string, subjectName: string, termField: 'term1' | 'term2' | 'term3', val: string) => {
    let numeric = parseInt(val) || 0;
    if (numeric > 100) numeric = 100;
    if (numeric < 0) numeric = 0;

    const copy = [...students];
    const targetIdx = copy.findIndex(s => s.id === studentId);
    if (targetIdx !== -1) {
      const gIdx = copy[targetIdx].grades.findIndex(g => g.subject === subjectName);
      if (gIdx !== -1) {
        copy[targetIdx].grades[gIdx][termField] = numeric;
        onUpdateStudents(copy);
      }
    }
  };

  // Handle local text remarks change 
  const handleRemarksChange = (studentId: string, val: string) => {
    const copy = [...students];
    const targetIdx = copy.findIndex(s => s.id === studentId);
    if (targetIdx !== -1) {
      copy[targetIdx].teacherRemarks = val;
      onUpdateStudents(copy);
    }
  };

  // Trigger Gemini API to analyze Grades and write assessment
  const generateAIEvaluation = async (student: Student) => {
    if (!student) return;
    setAiLoading(true);
    setAiError('');
    setAiWarning(false);
    
    try {
      const response = await fetch('/api/gemini/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.name,
          grade: student.grade,
          section: student.section,
          gradesList: student.grades
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error state.');
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      // If simulated fallback remark got created because key isn't setup
      if (data.isModelWorking === false) {
        setAiWarning(true);
      }

      // Save remark to student state
      const copy = [...students];
      const targetIdx = copy.findIndex(s => s.id === student.id);
      if (targetIdx !== -1) {
        copy[targetIdx].aiComment = data.remarks;
        await onUpdateStudents(copy);
      }

    } catch (err: any) {
      setAiError(err.message || 'Connecting to Gemini failed. Ensure server is online.');
    } finally {
      setAiLoading(false);
    }
  };

  // Submit wide-announcements
  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;

    setAnnSaving(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: annTitle,
          content: annContent,
          authorName: teacherData.name,
          grade: selectedGrade
        })
      });

      if (res.ok) {
        setAnnTitle('');
        setAnnContent('');
        setAnnSuccess(true);
        setTimeout(() => setAnnSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAnnSaving(false);
    }
  };

  // Quick fill simulated random grades to ease demonstration
  const handleQuickDemoFill = () => {
    const copy = [...students];
    copy.forEach(std => {
      std.grades.forEach(g => {
        g.term1 = Math.round(65 + Math.random() * 32);
        g.term2 = Math.round(68 + Math.random() * 30);
        g.term3 = Math.round(72 + Math.random() * 28);
      });
    });
    onUpdateStudents(copy);
  };

  // 1. Dynamic class subject extraction tool
  const getExistingClassSubjects = (gradeNum: number): SubjectGrade[] => {
    const classmate = students.find(s => s.grade === gradeNum);
    if (classmate && classmate.grades && classmate.grades.length > 0) {
      return classmate.grades.map(g => ({
        subject: g.subject,
        term1: 0,
        term2: 0,
        term3: 0,
        creditHours: g.creditHours
      }));
    }
    return [
      { subject: 'English', term1: 0, term2: 0, term3: 0, creditHours: 4 },
      { subject: 'Nepali', term1: 0, term2: 0, term3: 0, creditHours: 4 },
      { subject: 'Mathematics', term1: 0, term2: 0, term3: 0, creditHours: 4 },
      { subject: 'Science', term1: 0, term2: 0, term3: 0, creditHours: 4 },
      { subject: 'Social Studies', term1: 0, term2: 0, term3: 0, creditHours: 3 },
      { subject: 'ICT', term1: 0, term2: 0, term3: 0, creditHours: 2 }
    ];
  };

  // 2. Register dynamic student roster record
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!newStudentName.trim()) {
      setAdminError('Student full name cannot be blank.');
      return;
    }

    const gradeStudents = students.filter(s => s.grade === adminSelectGrade);
    const nextSn = gradeStudents.length > 0 ? Math.max(...gradeStudents.map(s => s.sn)) + 1 : 1;
    const newId = `G${adminSelectGrade}-S${nextSn}`;

    const defaultGrades = getExistingClassSubjects(adminSelectGrade);
    const pin = newStudentPin.trim() || Math.floor(1001 + Math.random() * 8999).toString();

    const newStudent: Student = {
      id: newId,
      sn: nextSn,
      name: newStudentName.trim(),
      grade: adminSelectGrade,
      section: newStudentSection.trim() || 'Butterfly',
      grades: defaultGrades,
      parentPin: pin,
      teacherRemarks: 'Admitted dynamically via Academic Administrative Desk.',
      aiComment: 'Awaiting first evaluation records.'
    };

    const updated = [...students, newStudent];
    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Successfully registered student ${newStudent.name} (ID: ${newId}, PIN: ${pin}) in Grade ${adminSelectGrade} (${newStudent.section})!`);
      setNewStudentName('');
      setNewStudentPin('');
    } catch (err) {
      setAdminError('Failed to synchronize and save new student data.');
    }
  };

  // 3. Save modified student details
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setAdminError('');
    setAdminSuccess('');

    if (!editingStudentName.trim()) {
      setAdminError('Student name cannot be empty.');
      return;
    }

    const updated = students.map(s => {
      if (s.id === editingStudent.id) {
        const copy = { ...s };
        copy.name = editingStudentName.trim();
        copy.section = editingStudentSection.trim() || s.section;
        copy.parentPin = editingStudentPin.trim() || s.parentPin;
        
        if (editingStudentGrade !== s.grade) {
          copy.grade = editingStudentGrade;
          const classStudents = students.filter(std => std.grade === editingStudentGrade && std.id !== s.id);
          copy.sn = classStudents.length > 0 ? Math.max(...classStudents.map(std => std.sn)) + 1 : 1;
          copy.id = `G${editingStudentGrade}-S${copy.sn}`;
          copy.grades = getExistingClassSubjects(editingStudentGrade);
        }
        return copy;
      }
      return s;
    });

    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Student credentials and classification logs updated successfully for ${editingStudentName}!`);
      setEditingStudent(null);
    } catch (err) {
      setAdminError('Failed to update student listing.');
    }
  };

  // 4. Delete registration listing
  const handleDeleteStudent = async (studentId: string) => {
    if (!window.confirm('Are you absolutely sure you want to remove this student? This will instantly wipe all active grading indices and parent messaging archives.')) {
      return;
    }
    setAdminError('');
    setAdminSuccess('');

    const target = students.find(s => s.id === studentId);
    const updated = students.filter(s => s.id !== studentId);

    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Wiped student ${target?.name || studentId} from school directory registers.`);
    } catch (err) {
      setAdminError('Failed to purge student file.');
    }
  };

  // 5. Integrate custom subject to active grade
  const handleAddSubjectToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    const subName = newSubjectName.trim();
    if (!subName) {
      setAdminError('Subject title cannot be empty.');
      return;
    }

    const classCount = students.filter(s => s.grade === adminSelectGrade).length;
    if (classCount === 0) {
      setAdminError(`No students found in Grade ${adminSelectGrade}. Subject curriculum can only be integrated once at least one student register is established.`);
      return;
    }

    const updated = students.map(s => {
      if (s.grade === adminSelectGrade) {
        const copy = { ...s };
        const exists = copy.grades.some(g => g.subject.toLowerCase() === subName.toLowerCase());
        if (!exists) {
          copy.grades = [
            ...copy.grades,
            {
              subject: subName,
              term1: 0,
              term2: 0,
              term3: 0,
              creditHours: newSubjectCreditHours
            }
          ];
        } else {
          setAdminError(`"${subName}" is already present in Grade ${adminSelectGrade} syllabus.`);
        }
        return copy;
      }
      return s;
    });

    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Successfully integrated "${subName}" (${newSubjectCreditHours} Cr) into Grade ${adminSelectGrade} syllabus!`);
      setNewSubjectName('');
    } catch (err) {
      setAdminError('Failed to alter grade syllabus.');
    }
  };

  // 6. Delete curricular subject from active grade
  const handleRemoveSubjectFromClass = async (subjectName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${subjectName}" from Grade ${adminSelectGrade} curriculum? This will delete all terminal marks for all students in this class.`)) {
      return;
    }
    setAdminError('');
    setAdminSuccess('');

    const updated = students.map(s => {
      if (s.grade === adminSelectGrade) {
        const copy = { ...s };
        copy.grades = copy.grades.filter(g => g.subject !== subjectName);
        return copy;
      }
      return s;
    });

    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Deleted subject "${subjectName}" from Grade ${adminSelectGrade} school curriculum.`);
    } catch (err) {
      setAdminError('Failed to remove subject from curriculum.');
    }
  };

  // 7. Scale credit hours
  const handleUpdateSubjectCreditHours = async (subjectName: string, creditHours: number) => {
    setAdminError('');
    setAdminSuccess('');
    const updated = students.map(s => {
      if (s.grade === adminSelectGrade) {
        const copy = { ...s };
        copy.grades = copy.grades.map(g => {
          if (g.subject === subjectName) {
            return { ...g, creditHours };
          }
          return g;
        });
        return copy;
      }
      return s;
    });

    try {
      await onUpdateStudents(updated);
      setAdminSuccess(`Updated credit hours of "${subjectName}" in Grade ${adminSelectGrade} to ${creditHours} Cr.`);
    } catch (err) {
      setAdminError('Failed to adjust subject credit hours.');
    }
  };

  return (
    <div id="teacher-view-root" className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      
      {/* Side Navigation Rail */}
      <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-5 border-b border-slate-200">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-1.5 bg-indigo-55 bg-indigo-600 text-white rounded-lg shadow-md shadow-indigo-100">
              <Users className="w-5 h-5" />
            </span>
            <div className="text-sm font-bold tracking-wide text-slate-900 leading-tight">Rajarshi Hub</div>
          </div>
          <div className="text-xs text-slate-450 font-semibold uppercase tracking-wider">Academic Portal</div>
        </div>

        {/* User Badge */}
        <div className="p-4 bg-slate-50/60 border-b border-slate-200">
          <div className="text-[9px] text-slate-400 font-mono uppercase tracking-wider mb-1">Authenticated Teacher</div>
          <div className="text-sm font-bold text-indigo-750 leading-tight">{teacherData.name}</div>
          <div className="text-[10px] text-slate-500 mt-1 truncate font-medium">{teacherData.email}</div>
        </div>

        {/* Sidebar Nav */}
        <div className="flex-grow p-4 space-y-1">
          <button
            id="nav-gradebook"
            onClick={() => setActiveMenu('gradebook')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'gradebook' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-4.5 h-4.5" />
            Grade Book Spreadsheet
          </button>
          <button
            id="nav-cdc-sheets"
            onClick={() => setActiveMenu('cdc-sheets')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'cdc-sheets' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4.5 h-4.5 text-indigo-600" />
            CDC Assessments & Sheets
          </button>
          <button
            id="nav-ai-writer"
            onClick={() => {
              setActiveMenu('ai-writer');
              if (currentStudentsInView.length > 0 && !selectedStudentId) {
                setSelectedStudentId(currentStudentsInView[0].id);
              }
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'ai-writer' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            Individual Assessment / AI
          </button>
          <button
            id="nav-announcements"
            onClick={() => setActiveMenu('announcements')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeMenu === 'announcements' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-150/50' 
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Send className="w-4.5 h-4.5" />
            Class Announcements
          </button>

          {teacherData.role === 'admin' && (
            <button
              id="nav-admin"
              onClick={() => setActiveMenu('admin')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeMenu === 'admin' 
                  ? 'bg-amber-50 text-amber-900 border border-amber-200/60 shadow-sm' 
                  : 'text-orange-600/90 hover:text-orange-850 hover:bg-amber-50/40'
              }`}
            >
              <ShieldCheck className="w-4.5 h-4.5 text-amber-600" />
              Admin Settings Portal
            </button>
          )}
        </div>

        {/* Sign out footer */}
        <div className="p-4 border-t border-slate-200">
          <button 
            id="btn-logout"
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs bg-white border border-slate-200 hover:border-red-200 hover:bg-rose-50/30 text-rose-650 rounded-xl font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out Portal
          </button>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full space-y-6">
        
        {/* Live Calendar Registry Overview */}
        {calendarData && calendarData.found && (
          <div id="calendar-widget-card" className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-650 animate-pulse" />
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">📅 Live Calendar Registry (Today's Portal Sync)</h3>
              </div>
              <span className="text-[10px] font-mono bg-indigo-50 border border-indigo-150 text-indigo-600 px-2 py-0.5 rounded-lg font-black">
                Spreadsheet Stream Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="space-y-1.5">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Term & Date</div>
                <div className="text-xs font-bold text-indigo-950 font-sans">{calendarData.term}</div>
                <div className="text-[11px] text-slate-500 font-semibold">{calendarData.englishDate}</div>
                <div className="text-[10px] text-slate-400 font-mono">🇳🇵 {calendarData.nepaliDate} ({calendarData.day})</div>
              </div>

              <div className="space-y-1.5 pt-3 md:pt-0 md:pl-4">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Day Type classification</div>
                <div className="flex flex-wrap gap-2 pt-0.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    (calendarData.dayTypeStudents || "").toLowerCase().includes('holiday') ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}>
                    STDNTS: {calendarData.dayTypeStudents}
                  </span>
                  <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                    TEACHRS: {calendarData.dayTypeTeachers}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-3 md:pt-0 md:pl-4 col-span-1 md:col-span-2">
                <div className="text-[10px] text-slate-400 font-mono uppercase font-bold tracking-wider">Academics & CCA Scheduling</div>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-750 flex items-start gap-1">
                    <span className="text-indigo-600 font-bold">CORE:</span> {calendarData.events}
                  </div>
                  <div className="text-xs text-slate-650 flex items-start gap-1 leading-normal">
                    <span className="text-emerald-600 font-bold">CCA/ECA:</span> {calendarData.ecaEvents}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-slate-100 flex flex-wrap gap-x-6 gap-y-1 text-[10.5px]">
              <div><span className="font-bold text-indigo-650">PRIMARY:</span> <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200/60 ml-1.5">{calendarData.primary}</span></div>
              <div><span className="font-bold text-indigo-650">MIDDLE:</span> <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200/60 ml-1.5">{calendarData.middleSchool}</span></div>
              <div><span className="font-bold text-indigo-650">SECONDARY:</span> <span className="bg-slate-50 text-slate-600 px-2 py-0.5 rounded font-medium border border-slate-200/60 ml-1.5">{calendarData.secondary}</span></div>
            </div>
          </div>
        )}

        {/* Central Controls Header */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center shadow-sm relative">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-indigo-600" />
              Centralized Marksheet Core
            </h2>
            <p className="text-xs text-slate-500">Manage interactive student grades and evaluation comments for Grades 1 through 10.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Grade Selection */}
            <div className="flex flex-col gap-1 min-w-[100px]">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Grade Level</label>
              <select
                id="select-grade"
                value={selectedGrade}
                onChange={(e) => {
                  const gr = parseInt(e.target.value);
                  setSelectedGrade(gr);
                  setSelectedSection('all');
                  setSelectedStudentId('');
                }}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>Grade {n}</option>
                ))}
              </select>
            </div>

            {/* Section Selection */}
            <div className="flex flex-col gap-1 min-w-[110px]">
              <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Section Group</label>
              <select
                id="select-section"
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedStudentId('');
                }}
                className="bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 font-semibold"
              >
                <option value="all">All Sections</option>
                {selectedGrade === 1 ? (
                  <>
                    <option value="Butterfly">Butterfly</option>
                    <option value="Bumble Bee">Bumble Bee</option>
                  </>
                ) : (
                  <>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="Redwoods">Redwoods</option>
                    <option value="Sagarmatha">Sagarmatha</option>
                    <option value="Mount Everest">Mount Everest</option>
                  </>
                )}
              </select>
            </div>

            {/* Shortcut actions */}
            <div className="flex flex-col gap-1 mt-auto">
              <button
                id="btn-fill-demo"
                onClick={handleQuickDemoFill}
                title="Populates randomized terminal report scores for live presentation testing"
                className="bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/20 text-indigo-650 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all w-full leading-relaxed font-semibold focus:outline-none shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Fill Simulated Scores
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Inner Panel View depending on activeMenu */}
        <AnimatePresence mode="wait">
          {activeMenu === 'gradebook' && (
            <motion.div
              key="gradebook"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Score spreadsheet grid */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-4 bg-white border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <FileSpreadsheet className="w-4.5 h-4.5 text-indigo-600" />
                      Dynamic Marks Entry Spreadsheet
                    </h3>
                    <p className="text-xs text-slate-500">Entering assessment scores automatically recalibrates overall status, GPA, and term averages.</p>
                  </div>
                  
                  {/* Subject switcher for spreadsheet */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-mono font-medium">Current Subject:</span>
                    <select
                      id="grid-subject"
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-xs text-indigo-700 font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
                    >
                      {availableSubjects.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Spreadsheet Element */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase font-mono tracking-wider">
                        <th className="p-3 pl-4 text-center w-12">SN</th>
                        <th className="p-3 min-w-[150px]">Student Name</th>
                        <th className="p-3 text-center min-w-[100px]">Section</th>
                        <th className="p-3 text-center w-28 bg-indigo-50/10 border-x border-slate-200">Term I (100)</th>
                        <th className="p-3 text-center w-28 bg-emerald-50/10 border-r border-slate-200">Term II (100)</th>
                        <th className="p-3 text-center w-28 bg-amber-50/10 border-r border-slate-200">Term III (100)</th>
                        <th className="p-3 text-center w-20">Average</th>
                        <th className="p-3 text-center w-20">Grade</th>
                        <th className="p-3 text-center w-20">GPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentStudentsInView.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-slate-400 bg-slate-50/40 text-xs font-mono">
                            No student registers exist for Grade {selectedGrade}, Section: {selectedSection}
                          </td>
                        </tr>
                      ) : (
                        currentStudentsInView.map((student) => {
                          const subjectData = student.grades.find(g => g.subject === selectedSubject) || {
                             term1: 0, term2: 0, term3: 0
                          };
                          const average = Math.round((subjectData.term1 + subjectData.term2 + subjectData.term3) / 3);
                          const evalStatus = calculateGradeAndGPA(average);

                          return (
                            <tr key={student.id} className="hover:bg-slate-50/40 transition-all font-sans text-xs">
                              <td className="p-3 text-center text-slate-400 font-mono font-bold border-r border-slate-150">{student.sn}</td>
                              <td className="p-3 font-semibold text-slate-850">
                                <div className="flex flex-col">
                                  <span>{student.name}</span>
                                  <span className="text-[10px] text-slate-400 font-mono uppercase font-medium">{student.id}</span>
                                </div>
                              </td>
                              <td className="p-3 text-center text-slate-500 font-bold">{student.section}</td>
                              
                              {/* Term 1 */}
                              <td className="p-3 text-center bg-indigo-50/5 border-x border-slate-150">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={subjectData.term1}
                                  onChange={(e) => handleScoreChange(student.id, selectedSubject, 'term1', e.target.value)}
                                  className="w-16 bg-white border border-slate-200 text-center font-mono rounded-md py-1 text-slate-805 focus:outline-none focus:border-indigo-500 font-bold"
                                />
                              </td>

                              {/* Term 2 */}
                              <td className="p-3 text-center bg-emerald-50/5 border-r border-slate-150">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={subjectData.term2}
                                  onChange={(e) => handleScoreChange(student.id, selectedSubject, 'term2', e.target.value)}
                                  className="w-16 bg-white border border-slate-200 text-center font-mono rounded-md py-1 text-slate-805 focus:outline-none focus:border-indigo-500 font-bold"
                                />
                              </td>

                              {/* Term 3 */}
                              <td className="p-3 text-center bg-amber-50/5 border-r border-slate-150">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  value={subjectData.term3}
                                  onChange={(e) => handleScoreChange(student.id, selectedSubject, 'term3', e.target.value)}
                                  className="w-16 bg-white border border-slate-200 text-center font-mono rounded-md py-1 text-slate-850 focus:outline-none focus:border-indigo-500 font-bold"
                                />
                              </td>

                              {/* Average Column */}
                              <td className="p-3 text-center font-bold text-slate-900 font-mono bg-slate-50/50 text-sm">{average}%</td>
                              
                              {/* Letter Grade */}
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${evalStatus.color}`}>
                                  {evalStatus.grade}
                                </span>
                              </td>

                              {/* GPA */}
                              <td className="p-3 text-center font-mono font-bold text-slate-700">{evalStatus.gpa.toFixed(2)}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeMenu === 'cdc-sheets' && (
            <motion.div
              key="cdc-sheets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* CDC Header & Sub Tabs Sub-Menu */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200 rounded-2xl p-4 gap-3 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 font-sans">
                    <Calendar className="w-4.5 h-4.5 text-indigo-655" />
                    Centralized Curriculum CDC Evaluation Platform (Grades 1-10)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage custom homework/practical/written evaluation columns, paste lists, configure weight matrices, and export reports.</p>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCdcActiveTab('gradesheet')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      cdcActiveTab === 'gradesheet'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📊 CDC Gradesheet Compiler
                  </button>
                  <button
                    onClick={() => {
                      setCdcActiveTab('entries');
                      setIsCdcEdit(false);
                      setActiveCdcColId(null);
                      setCdcFormTopic('');
                      setCdcFormFullMarks(10);
                      setCdcFormScores({});
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      cdcActiveTab === 'entries'
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    📝 Mark Entries & Columns Registry
                  </button>
                </div>
              </div>

              {/* SECTION A: CDC COMPILER ACTIVE */}
              {cdcActiveTab === 'gradesheet' && (() => {
                const currentClassStudents = students.filter(s => s.grade === selectedGrade);
                
                // INLINE HELPER: calculate matrix
                const getCdcCalculatedRowsLocal = (subjectName: string, termFilter: string) => {
                  const filteredAsms = assessments.filter(a => {
                    const matchGrade = a.grade === selectedGrade;
                    const matchSubject = a.subject === subjectName;
                    const matchTerm = termFilter === 'All' || a.term === termFilter;
                    return matchGrade && matchSubject && matchTerm;
                  });

                  const activeWeights = weights[subjectName] || [5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100];
                  
                  const taskMap: Record<string, number> = {
                    'ATT': 0, 'Discipline': 1, 'Practical': 3, 'Project Work': 4,
                    'HW': 5, 'CW': 6, 'UT': 8, 'Parental Evaluation': 9, 'Written Exam': 12
                  };

                  return currentClassStudents.map((student) => {
                    const calculatedScores = new Array(14).fill(0);
                    const categoryHasData = new Array(14).fill(false);

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
                        const rawScoreVal = asm.scores[student.id];
                        if (rawScoreVal !== undefined && rawScoreVal !== null && rawScoreVal !== "" && rawScoreVal !== "-") {
                          const scoreNum = parseFloat(rawScoreVal);
                          if (!isNaN(scoreNum)) {
                            accumulators[idx].earned += scoreNum;
                            accumulators[idx].max += asm.fullMarks;
                          }
                        }
                      }
                    });

                    Object.keys(accumulators).forEach(key => {
                      const idx = parseInt(key);
                      const acc = accumulators[idx];
                      const maxAllowed = activeWeights[idx];
                      if (acc.max > 0) {
                        calculatedScores[idx] = parseFloat(((acc.earned / acc.max) * maxAllowed).toFixed(1));
                        categoryHasData[idx] = true;
                      } else {
                        // fallback or mock values generator for pre-population 
                        const studentVariance = -5 + (student.sn * 3 + subjectName.length) % 11;
                        let defaultBaseline = (student.grades.find(g => g.subject === subjectName)?.term1 || 76) + studentVariance;
                        defaultBaseline = Math.max(30, Math.min(100, defaultBaseline));
                        calculatedScores[idx] = parseFloat(((defaultBaseline / 100) * maxAllowed).toFixed(1));
                        categoryHasData[idx] = true;
                      }
                    });

                    // Compute dynamic combinations
                    calculatedScores[2] = parseFloat((calculatedScores[0] + calculatedScores[1]).toFixed(1));
                    categoryHasData[2] = categoryHasData[0] || categoryHasData[1];

                    calculatedScores[7] = parseFloat((calculatedScores[3] + calculatedScores[4] + calculatedScores[5] + calculatedScores[6]).toFixed(1));
                    categoryHasData[7] = categoryHasData[3] || categoryHasData[4] || categoryHasData[5] || categoryHasData[6];

                    calculatedScores[10] = parseFloat((calculatedScores[8] + calculatedScores[9]).toFixed(1));
                    categoryHasData[10] = categoryHasData[8] || categoryHasData[9];

                    calculatedScores[11] = parseFloat((calculatedScores[2] + calculatedScores[7] + calculatedScores[10]).toFixed(1));
                    categoryHasData[11] = categoryHasData[2] || categoryHasData[7] || categoryHasData[10];

                    calculatedScores[13] = parseFloat((calculatedScores[11] + calculatedScores[12]).toFixed(1));
                    categoryHasData[13] = categoryHasData[11] || categoryHasData[12];

                    return {
                      id: student.id,
                      sn: student.sn,
                      name: student.name,
                      section: student.section,
                      scoresArray: calculatedScores.map((val, idx) => categoryHasData[idx] ? val : "-")
                    };
                  });
                };

                const cdcRows = getCdcCalculatedRowsLocal(selectedSubject, cdcTermFilter);
                const totalWeightsArray = weights[selectedSubject] || [5, 5, 10, 10, 10, 15, 15, 50, 5, 5, 10, 70, 30, 100];

                const printTable = () => {
                  const printContents = document.getElementById('cdc-printable-table')?.outerHTML;
                  if (!printContents) return alert("Nothing to print.");
                  const printWindow = window.open('', '', 'height=600,width=800');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Rajarshi Gurukul - Official CDC Gradesheet Report</title>
                          <style>
                            body { font-family: 'Segoe UI', system-ui, sans-serif; padding: 20px; color: #000; }
                            h2 { text-align: center; margin-bottom: 5px; font-weight: bold; font-size: 18px; }
                            h4 { text-align: center; font-weight: normal; margin-top: 0; color: #333; font-size: 13px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
                            th, td { border: 1px solid #000; text-align: center; padding: 6px; }
                            th { background-color: #f3f4f6; font-weight: bold; }
                            td { font-weight: 500; }
                          </style>
                        </head>
                        <body>
                          <h2>RAJARSHI GURUKUL</h2>
                          <h4 style="text-align: center;">Central Student Ledger CDC Evaluation matrix</h4>
                          <p style="font-size: 11px; margin-bottom: 15px;">
                            <strong>Grade Level:</strong> Grade ${selectedGrade} | 
                            <strong>Section:</strong> ${selectedSection === 'all' ? 'All Sections' : selectedSection} | 
                            <strong>Evaluated Subject:</strong> ${selectedSubject} | 
                            <strong>Reporting Session:</strong> ${cdcTermFilter === 'All' ? 'Full Session Summary' : cdcTermFilter + ' Term'}
                          </p>
                          ${printContents}
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                  }
                };

                const downloadCdcExcel = () => {
                  const table = document.getElementById('cdc-printable-table');
                  if (!table) return alert("Report grid element could not be found.");
                  const htmlContent = table.outerHTML;
                  const excelStyles = `
                    <style>
                      table { border-collapse: collapse; font-family: sans-serif; }
                      th, td { border: 1px solid #94a3b8; text-align: center; padding: 6px; font-size: 11px; }
                      th { font-weight: bold; background-color: #cbd5e1; }
                    </style>
                  `;
                  const payload = '\ufeff' + excelStyles + htmlContent;
                  const blob = new Blob([payload], { type: "application/vnd.ms-excel;charset=utf-8" });
                  const downloadUrl = URL.createObjectURL(blob);
                  const clientLink = document.createElement('a');
                  clientLink.href = downloadUrl;
                  clientLink.download = `CDC_Gradesheet_Grade_${selectedGrade}_${selectedSubject}_${cdcTermFilter}_Term.xls`;
                  document.body.appendChild(clientLink);
                  clientLink.click();
                  document.body.removeChild(clientLink);
                  URL.revokeObjectURL(downloadUrl);
                };

                return (
                  <div className="space-y-6">
                    {/* Filters & Actions Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-inner">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Class Grade</label>
                        <select
                          value={selectedGrade}
                          onChange={(e) => {
                            setSelectedGrade(parseInt(e.target.value));
                            setSelectedSection('all');
                          }}
                          className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Grade {n}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Section Group</label>
                        <select
                          value={selectedSection}
                          onChange={(e) => setSelectedSection(e.target.value)}
                          className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="all">All Sections Combined</option>
                          <option value="Butterfly">Butterfly</option>
                          <option value="Carnation">Carnation</option>
                          <option value="Daffodil">Daffodil</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">Curricular Subject</label>
                        <select
                          value={selectedSubject}
                          onChange={(e) => setSelectedSubject(e.target.value)}
                          className="bg-white border border-slate-200 text-xs text-indigo-850 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-bold"
                        >
                          {['English', 'Nepali', 'Mathematics', 'Science', 'Social Studies', 'ICT'].map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] uppercase font-mono font-bold text-slate-400">CDC Active Term</label>
                        <select
                          value={cdcTermFilter}
                          onChange={(e: any) => setCdcTermFilter(e.target.value)}
                          className="bg-white border border-slate-200 text-xs text-slate-800 rounded-lg p-2 focus:outline-none focus:border-indigo-500 font-semibold"
                        >
                          <option value="Spring">Spring Term</option>
                          <option value="Fall">Fall Term</option>
                          <option value="Final">Final Term</option>
                          <option value="All">All Terms Accumulators</option>
                        </select>
                      </div>
                    </div>

                    {/* Google Sheets Integration Control Center */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="bg-emerald-50 text-emerald-600 p-2 rounded-xl border border-emerald-150">
                            <FileSpreadsheet className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 font-sans">Google Sheets Integration Suite</h4>
                            <p className="text-xs text-slate-500">Enable actual spreadsheet read/write operations to live-compile student marksheets.</p>
                          </div>
                        </div>

                        {/* Authorization Button */}
                        <div>
                          {!googleUser ? (
                            <button
                              id="btn-sheets-connect"
                              onClick={handleGoogleConnect}
                              disabled={isSyncing}
                              className="text-xs font-bold font-sans bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                            >
                              <Globe className="w-3.5 h-3.5" />
                              Authorize Google Sheets
                            </button>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">Google Connected</span>
                                <span className="text-xs text-slate-500 max-w-[200px] truncate">{googleUser.email}</span>
                              </div>
                              <button
                                id="btn-sheets-disconnect"
                                onClick={handleGoogleDisconnect}
                                disabled={isSyncing}
                                className="text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              >
                                Disconnect
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Info Notifications */}
                      {(sheetError || sheetSuccess) && (
                        <div className="space-y-2">
                          {sheetError && (
                            <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-xl border border-red-150 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span className="font-medium">{sheetError}</span>
                            </div>
                          )}
                          {sheetSuccess && (
                            <div className="bg-emerald-50 text-emerald-800 text-xs p-3.5 rounded-xl border border-emerald-150 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                <span className="font-semibold">{sheetSuccess}</span>
                              </div>
                              {importSpreadsheetId && (
                                <a
                                  href={`https://docs.google.com/spreadsheets/d/${importSpreadsheetId}`}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm font-sans flex items-center gap-1 shrink-0 self-start sm:self-center"
                                >
                                  Open Google Sheet ↗
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Work Panels */}
                      {googleUser ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-1">
                          {/* Left Panel: Export */}
                          <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Share2 className="w-4 h-4 text-indigo-600" />
                                <h5 className="text-xs font-bold text-slate-800">Export Marksheet</h5>
                              </div>
                              <p className="text-xs text-slate-500 leading-relaxed">
                                Generates a full-featured spreadsheet inside your Google Drive. 
                                Instantly writes all {students.filter(s => s.grade === selectedGrade).length} students' progressive CDC evaluation records, including intermediate Attendance, Discipline, Practicals and written exam scores for <strong>{selectedSubject}</strong> ({cdcTermFilter} term).
                              </p>
                            </div>
                            <button
                              id="btn-sheets-export"
                              onClick={handleExportToGoogleSheets}
                              disabled={isSyncing}
                              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Download className="w-3.5 h-3.5" />
                              )}
                              Export to Google Sheets
                            </button>
                          </div>

                          {/* Right Panel: Sync/Import */}
                          <div className="border border-slate-150 rounded-xl p-4 bg-slate-50/50 space-y-3">
                            <div className="flex items-center gap-2">
                              <FileUp className="w-4 h-4 text-emerald-600" />
                              <h5 className="text-xs font-bold text-slate-800">Import/Sync from Spreadsheet</h5>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Import evaluator columns back. Enter a Google Spreadsheet ID or URL, choose the reading grid, and update school records dynamically.
                            </p>

                            <div className="space-y-2.5">
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400">Spreadsheet URL or Sheet ID</label>
                                <input
                                  type="text"
                                  value={importSpreadsheetId}
                                  onChange={(e) => setImportSpreadsheetId(e.target.value)}
                                  placeholder="https://docs.google.com/spreadsheets/d/..."
                                  className="bg-white border border-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-[10px] font-mono font-bold text-slate-400">Target Read Range (e.g., Tab!CellStart:CellEnd)</label>
                                <input
                                  type="text"
                                  value={importRange}
                                  onChange={(e) => setImportRange(e.target.value)}
                                  placeholder="Sheet1!A1:Q50"
                                  className="bg-white border border-slate-200 text-xs rounded-lg p-2 focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>

                            <button
                              id="btn-sheets-import"
                              onClick={handleImportFromGoogleSheets}
                              disabled={isSyncing}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                              {isSyncing ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <RefreshCw className="w-3.5 h-3.5" />
                              )}
                              Sync Local Database
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 p-4">
                          <AlertCircle className="w-5 h-5 text-indigo-400" />
                          <p className="text-xs text-slate-500 font-medium">Connect your Google Drive/Workspace account to enable actual compilation, syncing, and automatic spreadsheets creation.</p>
                        </div>
                      )}

                      {/* Raw Import Execution Console/Logs */}
                      {importedLog && (
                        <div className="bg-slate-900 border border-slate-800 text-slate-200 text-[10px] font-mono p-4 rounded-xl max-h-[170px] overflow-y-auto space-y-1">
                          <div className="text-teal-400 font-bold border-b border-slate-800 pb-1.5 mb-1.5 flex justify-between items-center">
                            <span>Google Sheets Sync Console</span>
                            <span className="text-[8px] uppercase bg-teal-950 px-1.5 py-0.5 rounded">Active stream</span>
                          </div>
                          <pre className="whitespace-pre-wrap">{importedLog}</pre>
                        </div>
                      )}
                    </div>

                    {/* TWO-COLUMN GRID: Left = Compiler Table view, Right = Weights scale configurator */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                      
                      {/* Left: Compiler Tables */}
                      <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <span className="text-[10px] uppercase font-mono bg-indigo-100 text-indigo-750 font-extrabold px-2.5 py-0.5 rounded">
                              Matrix calculation stream
                            </span>
                            <h4 className="text-sm font-bold text-slate-900 mt-1">
                              CDC Progressive Matrix (Grade {selectedGrade} - {selectedSubject})
                            </h4>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              id="btn-cdc-print"
                              onClick={printTable}
                              className="px-3 py-1.5 bg-slate-105 hover:bg-slate-200 border border-slate-200 font-bold text-slate-700 text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              Print Report
                            </button>
                            <button
                              id="btn-cdc-excel"
                              onClick={downloadCdcExcel}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 font-bold text-indigo-700 text-xs rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Excel Export
                            </button>
                          </div>
                        </div>

                        {/* Interactive CDC Spreadsheet Matrix Component */}
                        <div className="overflow-x-auto">
                          <table id="cdc-printable-table" className="w-full text-center text-[10.5px] border-collapse divide-y divide-slate-200">
                            <thead>
                              <tr className="bg-slate-50 text-slate-505 uppercase text-[9.5px] font-mono tracking-wider font-extrabold divide-x divide-slate-155">
                                <th rowSpan={2} className="p-2 bg-slate-100/70 border-b border-slate-250 w-10 text-center">SN</th>
                                <th rowSpan={2} className="p-2 bg-slate-100/70 border-b border-slate-250 min-w-[120px] text-left">Student Name</th>
                                <th rowSpan={2} className="p-2 bg-slate-100/70 border-b border-slate-250 text-center w-14">Section</th>
                                <th colSpan={3} className="p-1 bg-blue-50/40 border-b border-slate-200 font-black text-blue-750">PARTICIPATION Scale</th>
                                <th colSpan={5} className="p-1 bg-emerald-50/40 border-b border-slate-200 font-black text-emerald-700">PRACTICALS Portfolio</th>
                                <th colSpan={3} className="p-1 bg-amber-50/40 border-b border-slate-200 font-black text-amber-800">EVALUATION QUIZ</th>
                                <th rowSpan={2} className="p-1.5 bg-indigo-50/60 border-b border-indigo-300 font-black text-indigo-750">IN-TERM (70)</th>
                                <th rowSpan={2} className="p-1.5 bg-slate-50 border-b border-slate-250 font-black text-indigo-850">WRITTEN EXAM (30)</th>
                                <th rowSpan={2} className="p-1.5 bg-indigo-950 text-white border-b border-slate-250 font-black">OVERALL (100)</th>
                              </tr>
                              <tr className="bg-slate-50/50 text-[8.5px] font-semibold divide-y divide-x divide-slate-150">
                                <td className="p-1 text-slate-500 font-mono">ATT ({totalWeightsArray[0]})</td>
                                <td className="p-1 text-slate-500 font-mono">DISC ({totalWeightsArray[1]})</td>
                                <td className="p-1 bg-blue-50 font-mono font-bold text-blue-700">SUM ({totalWeightsArray[2]})</td>
                                
                                <td className="p-1 text-slate-500 font-mono">PRAC ({totalWeightsArray[3]})</td>
                                <td className="p-1 text-slate-500 font-mono">PROJ ({totalWeightsArray[4]})</td>
                                <td className="p-1 text-slate-500 font-mono">HW ({totalWeightsArray[5]})</td>
                                <td className="p-1 text-slate-500 font-mono">CW ({totalWeightsArray[6]})</td>
                                <td className="p-1 bg-emerald-50 font-mono font-bold text-emerald-700">SUM ({totalWeightsArray[7]})</td>
                                
                                <td className="p-1 text-slate-500 font-mono">UT ({totalWeightsArray[8]})</td>
                                <td className="p-1 text-slate-500 font-mono">PARENT ({totalWeightsArray[9]})</td>
                                <td className="p-1 bg-amber-50 font-mono font-bold text-amber-700">SUM ({totalWeightsArray[10]})</td>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white font-medium">
                              {currentClassStudents.length === 0 ? (
                                <tr>
                                  <td colSpan={17} className="p-8 text-center text-slate-450 font-medium italic">
                                    No students registered or matching Grade {selectedGrade} {selectedSection !== 'all' ? `Section ${selectedSection}` : ''}
                                  </td>
                                </tr>
                              ) : (
                                cdcRows
                                  .filter(row => selectedSection === 'all' || row.section === selectedSection)
                                  .map((row) => (
                                    <tr key={row.id} className="hover:bg-indigo-50/30 transition-all font-sans leading-normal divide-x divide-slate-100">
                                      <td className="p-1 text-slate-400 font-mono font-medium text-center bg-slate-50/30">{row.sn}</td>
                                      <td className="p-1.5 text-left font-bold text-slate-800">{row.name}</td>
                                      <td className="p-1 text-center text-slate-500 bg-slate-50/10">{row.section}</td>
                                      {/* Attendance */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[0]}</td>
                                      {/* Discipline */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[1]}</td>
                                      {/* Participation Total */}
                                      <td className="p-1 bg-blue-50/60 font-mono font-bold text-blue-750">{row.scoresArray[2]}</td>
                                      {/* Practical */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[3]}</td>
                                      {/* Project */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[4]}</td>
                                      {/* HW */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[5]}</td>
                                      {/* CW */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[6]}</td>
                                      {/* Practical Total */}
                                      <td className="p-1 bg-emerald-50/60 font-mono font-bold text-emerald-800">{row.scoresArray[7]}</td>
                                      {/* UT */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[8]}</td>
                                      {/* Parental */}
                                      <td className="p-1 font-mono text-slate-700">{row.scoresArray[9]}</td>
                                      {/* Evaluation Total */}
                                      <td className="p-1 bg-amber-50/60 font-mono font-bold text-amber-900">{row.scoresArray[10]}</td>
                                      {/* Practical Box */}
                                      <td className="p-1 bg-slate-50 font-mono font-black text-indigo-750">{row.scoresArray[11]}</td>
                                      {/* Written Final */}
                                      <td className="p-1 bg-indigo-50/40 font-mono font-extrabold text-indigo-900">{row.scoresArray[12]}</td>
                                      {/* Grand Overall */}
                                      <td className="p-1 bg-indigo-900 shadow-sm text-white font-mono font-black text-[12.5px]">{row.scoresArray[13]}</td>
                                    </tr>
                                  ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Right: Weights configurations card box */}
                      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-black uppercase text-indigo-850 tracking-wider flex items-center gap-1 font-sans">
                            <Settings className="w-3.5 h-3.5 text-indigo-650" />
                            Subject scale weights
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-1 leading-normal">
                            Define active scale values contribution out of 100 max for <strong>{selectedSubject}</strong> subject. Evaluator automatically weights points.
                          </p>
                        </div>

                        {weightsSuccess && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold p-2.5 rounded-lg font-mono">
                            {weightsSuccess}
                          </div>
                        )}
                        {weightsError && (
                          <div className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold p-2.5 rounded-lg font-mono">
                            {weightsError}
                          </div>
                        )}

                        <div className="space-y-3">
                          {/* Weight input values pairs list */}
                          {[
                            { name: "Attendance (ATT)", idx: 0 },
                            { name: "Conduct / Behavior", idx: 1 },
                            { name: "Part Sum (Comp)", idx: 2, isComp: true },
                            { name: "Practical Lab", idx: 3 },
                            { name: "Project Assignments", idx: 4 },
                            { name: "Homeworks (HW)", idx: 5 },
                            { name: "Classworks (CW)", idx: 6 },
                            { name: "Prac Sum (Comp)", idx: 7, isComp: true },
                            { name: "Unit Checkups (UT)", idx: 8 },
                            { name: "Parent Evaluation", idx: 9 },
                            { name: "Quiz Sum (Comp)", idx: 10, isComp: true },
                            { name: "In-Term Contribution", idx: 11, isComp: true },
                            { name: "Written Exam weight", idx: 12 },
                            { name: "CDC Scale (Grand)", idx: 13, isComp: true }
                          ].map(item => {
                            // Compute components dynamically
                            const attVal = item.idx === 2 ? editWeights[0] + editWeights[1] : 0;
                            const pracVal = item.idx === 7 ? editWeights[3] + editWeights[4] + editWeights[5] + editWeights[6] : 0;
                            const evalVal = item.idx === 10 ? editWeights[8] + editWeights[9] : 0;
                            const inTermBoxVal = item.idx === 11 ? (editWeights[0]+editWeights[1]) + (editWeights[3]+editWeights[4]+editWeights[5]+editWeights[6]) + (editWeights[8]+editWeights[9]) : 0;
                            const grandComp = item.idx === 13 ? inTermBoxVal + editWeights[12] : 0;
                            
                            const isEditable = !item.isComp;
                            const currentVal = item.isComp
                              ? (item.idx === 2 ? attVal : item.idx === 7 ? pracVal : item.idx === 10 ? evalVal : item.idx === 11 ? inTermBoxVal : grandComp)
                              : editWeights[item.idx] || 0;

                            return (
                              <div key={item.idx} className={`flex justify-between items-center text-xs pb-1.5 border-b border-slate-50 ${item.isComp ? 'bg-slate-50 font-bold border-l-2 p-1 border-indigo-400' : ''}`}>
                                <span className={item.isComp ? "text-indigo-950 font-extrabold text-[10px]" : "text-slate-650"}>{item.name}:</span>
                                {isEditable ? (
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={editWeights[item.idx] || 0}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value) || 0;
                                      const updated = [...editWeights];
                                      updated[item.idx] = val;
                                      
                                      // recalculate sums automatically on inputs
                                      updated[2] = updated[0] + updated[1];
                                      updated[7] = updated[3] + updated[4] + updated[5] + updated[6];
                                      updated[10] = updated[8] + updated[9];
                                      updated[11] = updated[2] + updated[7] + updated[10];
                                      updated[13] = updated[11] + updated[12];

                                      setEditWeights(updated);
                                    }}
                                    className="w-14 text-center border font-mono border-slate-200 py-0.5 rounded text-indigo-755 font-bold bg-white text-xs"
                                  />
                                ) : (
                                  <span className="text-right text-indigo-650 font-mono pr-2">{currentVal}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <button
                          id="btn-save-weights"
                          onClick={handleSaveWeightsMatrix}
                          className="w-full text-center py-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Update Weight Values
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })()}

              {/* SECTION B: COLUMN MARK ENTRIES ACTIVE */}
              {cdcActiveTab === 'entries' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column: Form to create or edit Assessment Column */}
                  <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-2">
                      <h4 className="text-sm font-bold text-slate-900 font-sans">
                        {activeCdcColId ? "✏5 Edit Column Evaluation Settings" : "➕ Create Evaluation Data-Entry Column"}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">Specify category parameters, full marks, and input student scores or batch paste.</p>
                    </div>

                    <div className="space-y-3.5 text-xs text-slate-700">
                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Evaluated Grade Class:</label>
                        <span className="font-bold text-slate-900 text-xs bg-slate-50 border border-slate-150 p-2 rounded">
                          Grade {selectedGrade}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Subject Context:</label>
                        <span className="font-bold text-indigo-750 text-xs bg-indigo-50 border border-indigo-150 p-2 rounded">
                          {selectedSubject}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Term Period:</label>
                        <select
                          value={cdcFormTerm}
                          onChange={(e: any) => setCdcFormTerm(e.target.value)}
                          className="bg-white border border-slate-250 p-2 rounded focus:outline-none focus:border-indigo-500 font-medium text-xs height-10"
                        >
                          <option value="Spring">Spring Term</option>
                          <option value="Fall">Fall Term</option>
                          <option value="Final">Final Term</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">CDC Task Category:</label>
                        <select
                          value={cdcFormTask}
                          onChange={(e: any) => setCdcFormTask(e.target.value)}
                          className="bg-white border border-slate-250 p-2 rounded focus:outline-none focus:border-indigo-500 font-bold text-indigo-750 text-xs height-10"
                        >
                          <option value="HW">Homeworks (HW)</option>
                          <option value="CW">Classworks (CW)</option>
                          <option value="Practical">Laboratory Practical</option>
                          <option value="Project Work">Project Work / Midterm Presentation</option>
                          <option value="UT">Unit Checkup Test (UT)</option>
                          <option value="ATT">Class Attendance Log (ATT)</option>
                          <option value="Discipline">Behavior & Attitude review</option>
                          <option value="Parental Evaluation">Guardian Parental Evaluation</option>
                          <option value="Written Exam">Theoretical Written Exam paper</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Evaluation Assignment Topic or Quiz Name:</label>
                        <input
                          id="inp-cdc-topic"
                          type="text"
                          value={cdcFormTopic}
                          onChange={(e) => setCdcFormTopic(e.target.value)}
                          placeholder="e.g. Unit Chapter 3 Quiz, Physics Project Poster"
                          className="bg-white border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 text-xs height-10"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Full Marks Limit:</label>
                        <input
                          id="inp-cdc-fm"
                          type="number"
                          min={1}
                          max={100}
                          value={cdcFormFullMarks}
                          onChange={(e) => setCdcFormFullMarks(parseInt(e.target.value) || 10)}
                          className="bg-white border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 font-bold text-xs height-10"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="font-semibold text-slate-600">Evaluation Date Record:</label>
                        <input
                          type="date"
                          value={cdcFormDate}
                          onChange={(e) => setCdcFormDate(e.target.value)}
                          className="bg-white border border-slate-200 p-2 rounded focus:outline-none focus:border-indigo-500 font-mono text-xs height-10"
                        />
                      </div>

                      {/* EXCEL EXCELLENT BATCH COPY PASTE PORTAL SECTION */}
                      <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-2 mt-4">
                        <div className="flex justify-between items-center">
                          <label className="font-bold text-[10.5px] uppercase text-indigo-900 block tracking-tight font-sans">
                            📥 Excel Copy-Paste Entry scale
                          </label>
                          <span className="text-[8.5px] bg-indigo-600 text-white font-mono px-1.5 py-0.5 rounded font-black animate-pulse">Live</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          Copy a score column list from Excel/Google Sheets. Paste below to auto-resolve matching Sn values sequentially in order!
                        </p>
                        <textarea
                          placeholder={`Paste score list here. E.g:\n9\n8.5\n7\n10\n8`}
                          id="cdc-excel-batch-paste"
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (!val) return;
                            const lines = val.split(/\r?\n/).map(l => l.trim()).filter(l => l !== "");
                            const updatedScores = { ...cdcFormScores };
                            const classStudents = students.filter(s => s.grade === selectedGrade && (selectedSection === 'all' || s.section === selectedSection));
                            const sortedST = [...classStudents].sort((a,b) => a.sn - b.sn);
                            let count = 0;
                            lines.forEach((scoreStr, index) => {
                              if (index < sortedST.length) {
                                updatedScores[sortedST[index].id] = scoreStr;
                                count++;
                              }
                            });
                            setCdcFormScores(updatedScores);
                            alert(`Successfully mapped ${count} sequential scores from clipboard!`);
                          }}
                          className="w-full h-16 bg-white border border-slate-200 text-[10px] font-mono leading-normal p-2 rounded focus:outline-none focus:border-indigo-500"
                        />
                        <div className="text-[9px] text-slate-400 italic text-center">
                          *Bypasses manually typing rows. Saves instant time.*
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        {activeCdcColId && (
                          <button
                            onClick={() => {
                              setIsCdcEdit(false);
                              setActiveCdcColId(null);
                              setCdcFormTopic('');
                              setCdcFormFullMarks(10);
                              setCdcFormScores({});
                            }}
                            className="flex-1 py-2 text-center border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          id="btn-cdc-save"
                          onClick={handleSaveCdcAssessment}
                          className="flex-grow py-2.5 text-center bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-750 shadow-sm rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {activeCdcColId ? "Synchronize Updates" : "Create Data Column"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Center Column: Interactive Marks score card entry editor */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-sans">Student Scoresheet Input Matrix</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Input raw student scores (Max Full Marks: {cdcFormFullMarks}).</p>
                      </div>
                      <span className="text-[10px] font-mono font-bold text-indigo-750 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                        {cdcFormTask} category
                      </span>
                    </div>

                    <div className="overflow-y-auto max-h-[480px] divide-y divide-slate-100 space-y-2 pr-1.5 flex-grow">
                      {students.filter(s => s.grade === selectedGrade && (selectedSection === 'all' || s.section === selectedSection)).length === 0 ? (
                        <p className="text-xs text-slate-400 italic text-center py-10">No students found matching filters.</p>
                      ) : (
                        students
                          .filter(s => s.grade === selectedGrade && (selectedSection === 'all' || s.section === selectedSection))
                          .map(student => {
                            const score = cdcFormScores[student.id] || '';
                            return (
                              <div key={student.id} className="flex justify-between items-center py-2 text-xs font-sans">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                    <span className="text-slate-400 text-[10px] font-mono bg-slate-100/70 px-1 py-0.5 rounded-md">
                                      Sn {student.sn}
                                    </span>
                                    {student.name}
                                  </div>
                                  <div className="text-[10px] text-slate-505">Section {student.section}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-mono font-semibold text-slate-400">Earned/</span>
                                  <input
                                    type="text"
                                    placeholder="-"
                                    value={score}
                                    onChange={(e) => {
                                      const rawVal = e.target.value;
                                      setCdcFormScores(prev => ({
                                        ...prev,
                                        [student.id]: rawVal
                                      }));
                                    }}
                                    className="w-14 bg-slate-50 border border-slate-200 py-1 text-center font-mono font-bold rounded-lg text-indigo-850 text-xs focus:outline-none focus:border-indigo-500 focus:bg-white"
                                  />
                                  <span className="text-[10.5px] font-mono text-slate-400">/ {cdcFormFullMarks}</span>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>

                    <p className="text-[10.5px] text-slate-450 italic leading-relaxed pt-2 border-t border-slate-100 font-sans">
                      *Note: Ensure to Click "Create Data Column" or "Synchronize Updates" on left form to permanently save score matrices in the database ledger.*
                    </p>
                  </div>

                  {/* Right Column: List of existing assessments columns created */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col max-h-[640px] overflow-hidden">
                    <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 font-sans">Custom Columns Directory</h4>
                        <p className="text-[10.5px] text-slate-450 mt-0.5">Filter items matching context parameters ({selectedSubject}).</p>
                      </div>
                      <span className="text-[10.5px] text-slate-400 font-mono font-extrabold bg-slate-50 border px-1.5 py-0.5 rounded">
                        {assessments.filter(a => a.grade === selectedGrade && a.subject === selectedSubject).length} cols
                      </span>
                    </div>

                    <div className="overflow-y-auto space-y-3.5 pr-1 py-3 flex-grow divide-y divide-slate-100">
                      {assessments.filter(a => a.grade === selectedGrade && a.subject === selectedSubject).length === 0 ? (
                        <div className="text-center py-12 text-slate-400 font-medium italic text-xs">
                          No custom data-entry columns registered yet for Grade {selectedGrade} - {selectedSubject}. Click columns form to create one.
                        </div>
                      ) : (
                        assessments
                          .filter(a => a.grade === selectedGrade && a.subject === selectedSubject)
                          .map((asm) => (
                            <div key={asm.id} className="pt-3 first:pt-0 pb-1.5 flex flex-col justify-between gap-1.5 font-sans">
                              <div className="flex justify-between items-start">
                                <div className="space-y-0.5">
                                  <span className="text-[9.5px] uppercase font-mono font-bold bg-indigo-105 text-indigo-750 px-2 py-0.5 rounded">
                                    {asm.task} • {asm.term}
                                  </span>
                                  <h5 className="text-[11.5px] font-bold text-slate-800 leading-tight mt-1">{asm.topic}</h5>
                                  <div className="text-[10px] text-slate-455 font-mono">Date: {asm.date}</div>
                                </div>
                                <span className="text-xs font-mono font-bold text-indigo-650 bg-slate-50 border px-2 py-0.5 rounded">
                                  FM: {asm.fullMarks}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-2 text-[10.5px]">
                                <span className="text-slate-500 font-serif font-medium">
                                  Captured entries: <strong className="text-slate-800 font-mono font-black">{Object.keys(asm.scores).length} count</strong>
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleEditCdcColInit(asm)}
                                    className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-semibold text-slate-650 transition-all text-[10px] cursor-pointer"
                                  >
                                    Edit Scores
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCdcCol(asm.id)}
                                    className="p-1 hover:bg-slate-100 text-rose-550 border border-transparent rounded transition-all cursor-pointer"
                                    title="Wipe record"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                      )}
                    </div>
                  </div>

                </div>
              )}

            </motion.div>
          )}

          {activeMenu === 'ai-writer' && (
            <motion.div
              key="ai-writer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Student selection lists list */}
              <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col max-h-[600px] overflow-hidden">
                <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <GraduationCap className="w-4.5 h-4.5 text-indigo-600" />
                  Select Student
                </h3>
                <div className="overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100">
                  {currentStudentsInView.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-8 font-mono font-medium">No students match filter criteria.</p>
                  ) : (
                    currentStudentsInView.map((student) => {
                      const isSelected = currentFocusStudent?.id === student.id;
                      const averageAll = Math.round(
                        student.grades.reduce((acc, g) => acc + (g.term1 + g.term2 + g.term3) / 3, 0) / student.grades.length
                      );
                      const reportStatus = calculateGradeAndGPA(averageAll);

                      return (
                        <button
                          key={student.id}
                          onClick={() => setSelectedStudentId(student.id)}
                          className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between border ${
                            isSelected 
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                              : 'bg-white text-slate-700 border-transparent hover:bg-slate-50'
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold leading-none">{student.name}</div>
                            <div className="text-[10px] text-slate-450 font-mono font-semibold tracking-wide">{student.id} | PIN {student.parentPin}</div>
                          </div>
                          <span className={`text-[10px] uppercase font-bold font-mono px-1.5 py-0.5 rounded border leading-none ${reportStatus.color}`}>
                            {reportStatus.grade}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Assessment Panel fields */}
              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6">
                {!currentFocusStudent ? (
                  <div className="text-center p-12 text-slate-400 text-xs font-mono">
                    Please populate student details to generate records.
                  </div>
                ) : (
                  <div className="space-y-5">
                    
                    {/* Identification block */}
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-0.5 font-bold">Individual Evaluation Context</div>
                        <h3 className="text-base font-bold text-slate-900">{currentFocusStudent.name}</h3>
                        <div className="text-xs text-indigo-700 font-bold mt-0.5 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg inline-block">
                          Grade {currentFocusStudent.grade} • Section {currentFocusStudent.section}
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right">
                        <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-0.5 font-bold">Overall Academic Metric</div>
                        {(() => {
                          const avgValue = Math.round(
                            currentFocusStudent.grades.reduce((acc, g) => acc + (g.term1 + g.term2 + g.term3) / 3, 0) / currentFocusStudent.grades.length
                          );
                          const stat = calculateGradeAndGPA(avgValue);
                          return (
                            <div className="flex flex-col items-start sm:items-end gap-1">
                              <span className={`px-2.5 py-1 text-sm font-bold rounded border ${stat.color}`}>
                                {stat.grade} ({stat.gpa.toFixed(2)} GPA)
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* AI Assessment generator block */}
                    <div className="p-4 bg-gradient-to-br from-indigo-50/30 to-white border border-indigo-150 rounded-xl space-y-3 relative shadow-inner">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-widest font-mono flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Gemini AI Progress Assessor
                          </h4>
                          <p className="text-xs text-slate-500">Directly writes personalized term summaries and reports comments based on structural grades.</p>
                        </div>

                        <button
                          id="btn-generate-ai"
                          onClick={() => generateAIEvaluation(currentFocusStudent)}
                          disabled={aiLoading}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 px-3 rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          {aiLoading ? 'Analyzing...' : 'Generate report content'}
                        </button>
                      </div>

                      {/* Display warnings if local mocked AI model runs successfully */}
                      {aiWarning && (
                        <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg text-[10px] text-yellow-750 font-semibold leading-relaxed font-sans">
                          ⚠️ Local Sandbox Fallback active. Since no GEMINI_API_KEY was found in Secrets, the app has safely synthesized pre-formatted appraisal data. Enter a key to test real AI generation.
                        </div>
                      )}

                      {aiError && (
                        <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[10px] text-red-750 font-semibold leading-relaxed font-sans">
                          ❌ {aiError}
                        </div>
                      )}

                      {/* Comment body */}
                      <div className="relative">
                        <textarea
                          id="ai-remarks"
                          value={currentFocusStudent.aiComment || ''}
                          onChange={(e) => {
                            const copy = [...students];
                            const tIdx = copy.findIndex(s => s.id === currentFocusStudent.id);
                            if (tIdx !== -1) {
                              copy[tIdx].aiComment = e.target.value;
                              onUpdateStudents(copy);
                            }
                          }}
                          placeholder="Generate with AI Comment Assistant above or write manual feedback remarks here..."
                          rows={6}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans font-semibold"
                        />
                      </div>
                    </div>

                    {/* Quick Manual comments editable fields */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider">Teacher Final Hand-written Remarks</label>
                      <textarea
                        id="handwrite-remarks"
                        value={currentFocusStudent.teacherRemarks || ''}
                        onChange={(e) => handleRemarksChange(currentFocusStudent.id, e.target.value)}
                        placeholder="Write constructive suggestions or direct messages to parents..."
                        rows={3}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 leading-relaxed font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeMenu === 'announcements' && (
            <motion.div
              key="announcements"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6"
            >
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-indigo-650" />
                  Broadcasting Center
                </h3>
                <p className="text-xs text-slate-500 font-sans">Publish alerts, timetable changes, class news, and report schedules directly to students and parent bulletins.</p>
              </div>

              {annSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Message broadcasted successfully on students profiles.
                </div>
              )}

              <form id="ann-creator-form" onSubmit={handlePostAnnouncement} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Announcement Heading</label>
                  <input
                    id="ann-title-input"
                    type="text"
                    value={annTitle}
                    onChange={(e) => setAnnTitle(e.target.value)}
                    required
                    placeholder="e.g. Second Terminal Exams & Project Work Scope"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-4 text-xs text-slate-850 focus:outline-none focus:border-indigo-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase font-mono">Content Details</label>
                  <textarea
                    id="ann-content-input"
                    value={annContent}
                    onChange={(e) => setAnnContent(e.target.value)}
                    required
                    placeholder="Provide details about dates, requirements, or materials needed..."
                    rows={5}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 leading-relaxed font-semibold"
                  />
                  <span className="text-[10px] text-slate-450 mt-1 block font-medium">Targets currently selected Grade {selectedGrade} classes.</span>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    id="btn-post-ann"
                    type="submit"
                    disabled={annSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-5 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {annSaving ? 'Broadcasting...' : 'Publish Board Announcement'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {activeMenu === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/5 to-transparent border border-amber-200/60 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-extrabold text-amber-905 flex items-center gap-2 leading-tight">
                    <ShieldCheck className="w-5.5 h-5.5 text-amber-600 flex-shrink-0" />
                    Academic command Center
                  </h3>
                  <p className="text-xs text-slate-500">
                    Perform university academic coordinator tasks: register students, move sections, configure core subjects and syllabi.
                  </p>
                </div>
                
                <div id="admin-subtab-controls" className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-shrink-0">
                  <button
                    id="btn-subtab-students"
                    onClick={() => { setAdminSubTab('students'); setAdminSuccess(''); setAdminError(''); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      adminSubTab === 'students' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Manage Students
                  </button>
                  <button
                    id="btn-subtab-subjects"
                    onClick={() => { setAdminSubTab('subjects'); setAdminSuccess(''); setAdminError(''); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      adminSubTab === 'subjects' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Class Subjects
                  </button>
                  <button
                    id="btn-subtab-overview"
                    onClick={() => { setAdminSubTab('overview'); setAdminSuccess(''); setAdminError(''); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      adminSubTab === 'overview' ? 'bg-white text-slate-950 shadow-sm border border-slate-200/40' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Institutional Stats
                  </button>
                </div>
              </div>

              {/* Success and Error messages */}
              {adminSuccess && (
                <div id="admin-success-toast" className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-800 text-xs rounded-xl flex items-center gap-2.5 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>{adminSuccess}</span>
                </div>
              )}
              {adminError && (
                <div id="admin-error-toast" className="p-3 bg-rose-50 border border-rose-250 text-rose-800 text-xs rounded-xl flex items-center gap-2.5 font-semibold">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              {/* Sub tabs rendering */}
              {adminSubTab === 'students' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left card: Roster table */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900">Student Enrollment Directory</h4>
                        <p className="text-[11px] text-slate-500">Listing current registered student records in selected grade level.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 font-mono">Select Grade:</span>
                        <select
                          id="admin-grade-select"
                          value={adminSelectGrade}
                          onChange={(e) => {
                            setAdminSelectGrade(parseInt(e.target.value));
                            setEditingStudent(null);
                          }}
                          className="bg-slate-50 border border-slate-250 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-amber-200"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Grade {n}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-105 font-bold uppercase tracking-wider font-mono text-[9px] sm:text-[10px]">
                          <tr>
                            <th className="p-3">SN</th>
                            <th className="p-3">ID</th>
                            <th className="p-3">Full Name</th>
                            <th className="p-3 text-center">Section</th>
                            <th className="p-3 text-center font-sans">PIN</th>
                            <th className="p-3 text-center">Courses</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {students.filter(s => s.grade === adminSelectGrade).length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-6 text-center text-slate-400 font-medium">
                                No registered students in Grade {adminSelectGrade} yet. Add a new record in the enrollment desk on the right!
                              </td>
                            </tr>
                          ) : (
                            students
                              .filter(s => s.grade === adminSelectGrade)
                              .sort((a,b) => a.sn - b.sn)
                              .map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-mono font-bold text-slate-400">{student.sn}</td>
                                  <td className="p-3 font-mono font-bold text-indigo-650">{student.id}</td>
                                  <td className="p-3 font-bold text-slate-800">{student.name}</td>
                                  <td className="p-3 text-center">
                                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                      {student.section}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-slate-500">{student.parentPin}</td>
                                  <td className="p-3 text-center font-mono font-bold text-slate-500">{student.grades?.length || 0}</td>
                                  <td className="p-3 text-right space-x-1 whitespace-nowrap">
                                    <button
                                      id={`btn-edit-std-${student.id}`}
                                      onClick={() => {
                                        setEditingStudent(student);
                                        setEditingStudentName(student.name);
                                        setEditingStudentGrade(student.grade);
                                        setEditingStudentSection(student.section);
                                        setEditingStudentPin(student.parentPin || '');
                                        setAdminSuccess('');
                                        setAdminError('');
                                      }}
                                      className="text-indigo-600 hover:text-indigo-800 font-bold px-2 py-1 bg-indigo-50 hover:bg-indigo-120 hover:scale-105 rounded transition-transform text-[11px]"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      id={`btn-delete-std-${student.id}`}
                                      onClick={() => handleDeleteStudent(student.id)}
                                      className="text-rose-600 hover:text-rose-800 font-bold px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded transition-transform text-[11px]"
                                    >
                                      Purge
                                    </button>
                                  </td>
                                </tr>
                              ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right card: Form desk */}
                  <div className="space-y-6">
                    {editingStudent ? (
                      <div id="editing-student-card" className="bg-amber-50/45 border border-amber-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-amber-200">
                          <h4 className="text-xs font-bold font-mono tracking-wider text-amber-800 uppercase flex items-center gap-1.5">
                            <Settings className="w-4 h-4 animate-spin-slow" />
                            Update Student Registers
                          </h4>
                          <button
                            onClick={() => setEditingStudent(null)}
                            className="text-[10px] text-slate-600 hover:text-slate-900 font-bold bg-white border border-slate-250 rounded-md px-2 py-0.5"
                          >
                            Cancel
                          </button>
                        </div>

                        <form onSubmit={handleEditStudentSubmit} className="space-y-3 text-xs">
                          <div>
                            <label className="block text-slate-500 font-mono font-bold mb-1">Student Record ID (Immutable)</label>
                            <input
                              type="text"
                              value={editingStudent.id}
                              disabled
                              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 font-mono disabled:opacity-75"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-500 font-mono font-bold mb-1">Full Legal Name</label>
                            <input
                              type="text"
                              required
                              value={editingStudentName}
                              onChange={(e) => setEditingStudentName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Grade Level</label>
                              <select
                                value={editingStudentGrade}
                                onChange={(e) => setEditingStudentGrade(parseInt(e.target.value))}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none focus:border-amber-500"
                              >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>Grade {n}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Section Code</label>
                              <input
                                type="text"
                                required
                                value={editingStudentSection}
                                onChange={(e) => setEditingStudentSection(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg p-2 font-semibold text-slate-800 focus:outline-none focus:border-amber-550"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-slate-500 font-mono font-bold mb-1">Secure Parent PIN (4 digit)</label>
                            <input
                              type="text"
                              required
                              maxLength={4}
                              value={editingStudentPin}
                              onChange={(e) => setEditingStudentPin(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 font-mono font-semibold tracking-widest text-slate-800 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 px-4 shadow font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Save Student Credentials
                          </button>
                        </form>
                      </div>
                    ) : (
                      /* New Admission Card */
                      <div id="new-admission-card" className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4">
                        <div className="pb-2 border-b border-slate-100">
                          <h4 className="text-xs font-extrabold font-mono tracking-wider text-indigo-700 uppercase flex items-center gap-1.5">
                            <PlusCircle className="w-4 h-4" />
                            Enrollment Registration Desk
                          </h4>
                        </div>

                        <form onSubmit={handleCreateStudent} className="space-y-3.5 text-xs">
                          <div>
                            <label className="block text-slate-500 font-mono font-bold mb-1">Full Legal Name</label>
                            <input
                              type="text"
                              value={newStudentName}
                              onChange={(e) => setNewStudentName(e.target.value)}
                              placeholder="e.g. Priyanshu Sharma"
                              required
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Cohort / Class</label>
                              <select
                                value={adminSelectGrade}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value);
                                  setAdminSelectGrade(val);
                                  if (val === 1) {
                                    setNewStudentSection('Butterfly');
                                  } else {
                                    setNewStudentSection('Redwoods');
                                  }
                                }}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-semibold focus:outline-none"
                              >
                                {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                                  <option key={n} value={n}>Grade {n}</option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-500 font-mono font-bold mb-1">Section</label>
                              <input
                                type="text"
                                value={newStudentSection}
                                onChange={(e) => setNewStudentSection(e.target.value)}
                                placeholder="e.g. Redwoods, Orchid"
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-805 font-semibold focus:outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between mb-1">
                              <label className="block text-slate-500 font-mono font-bold">Secure login PIN</label>
                              <span className="text-[10px] text-slate-400 font-medium">Auto-generated if empty</span>
                            </div>
                            <input
                              type="text"
                              maxLength={4}
                              value={newStudentPin}
                              onChange={(e) => setNewStudentPin(e.target.value.replace(/\D/g, ''))}
                              placeholder="e.g. 1001"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono tracking-widest text-slate-800 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 px-4 shadow-md shadow-indigo-100 font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Register Student File
                          </button>
                        </form>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {adminSubTab === 'subjects' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left checklist of current class subjects */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-slate-900">Syllabus Courses & Credit Hours Configuration</h4>
                        <p className="text-[11px] text-slate-500">Configure core compulsory list of subjects & credit hour allocations for Grade classes.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-400 font-mono">Select Grade:</span>
                        <select
                          value={adminSelectGrade}
                          onChange={(e) => setAdminSelectGrade(parseInt(e.target.value))}
                          className="bg-slate-50 border border-slate-250 text-xs rounded-lg px-2.5 py-1.5 font-bold focus:outline-none"
                        >
                          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                            <option key={n} value={n}>Grade {n}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-xl">
                      <table className="w-full text-left text-xs text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-105 font-bold uppercase tracking-wider font-mono text-[9px] sm:text-[10px]">
                          <tr>
                            <th className="p-3">Subject Name</th>
                            <th className="p-3 text-center">Assigned Credit Weight</th>
                            <th className="p-3 text-center">Status</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-semibold text-xs text-slate-800">
                          {(() => {
                            const classmate = students.find(s => s.grade === adminSelectGrade);
                            if (!classmate || !classmate.grades || classmate.grades.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-slate-400 font-medium">
                                    No syllabus records or registered students exists in Grade {adminSelectGrade} to configure yet. Enroll a student first!
                                  </td>
                                </tr>
                              );
                            }

                            return classmate.grades.map((gradeSlot) => (
                              <tr key={gradeSlot.subject} className="hover:bg-slate-50 transition-colors">
                                <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                                  <BookOpen className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                                  {gradeSlot.subject}
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      disabled={gradeSlot.creditHours <= 1}
                                      onClick={() => handleUpdateSubjectCreditHours(gradeSlot.subject, gradeSlot.creditHours - 1)}
                                      className="text-slate-500 hover:text-indigo-600 disabled:opacity-30 border border-slate-200 rounded w-5 h-5 flex items-center justify-center bg-white shadow-xs"
                                    >
                                      -
                                    </button>
                                    <span className="font-mono font-bold bg-slate-100 px-2 py-0.5 rounded text-indigo-900 text-xs shadow-inner whitespace-nowrap">
                                      {gradeSlot.creditHours} hours
                                    </span>
                                    <button
                                      disabled={gradeSlot.creditHours >= 10}
                                      onClick={() => handleUpdateSubjectCreditHours(gradeSlot.subject, gradeSlot.creditHours + 1)}
                                      className="text-slate-500 hover:text-indigo-600 border border-slate-200 rounded w-5 h-5 flex items-center justify-center bg-white shadow-xs"
                                    >
                                      +
                                    </button>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] border border-emerald-100">
                                    Compulsory
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    id={`btn-remove-sub-${gradeSlot.subject.replace(/\s+/g, '-')}`}
                                    onClick={() => handleRemoveSubjectFromClass(gradeSlot.subject)}
                                    className="text-rose-600 hover:text-rose-850 font-bold px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 rounded text-[11px]"
                                  >
                                    De-integrate
                                  </button>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Right Column: Add Course Subject Form */}
                  <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-sm space-y-4 h-fit">
                    <div className="pb-2 border-b border-slate-100">
                      <h4 className="text-xs font-extrabold font-mono tracking-wider text-amber-700 uppercase flex items-center gap-1.5">
                        <PlusCircle className="w-4 h-4" />
                        Integrate Course Subject
                      </h4>
                    </div>

                    <p className="text-[11.5px] text-slate-500 leading-relaxed font-sans mt-1">
                      Integrating a new subject dynamically appends the course slot to the term sheets of 
                      <strong> ALL</strong> students currently enrolled in Grade {adminSelectGrade}.
                    </p>

                    <form onSubmit={handleAddSubjectToClass} className="space-y-3.5 text-xs pt-1">
                      <div>
                        <label className="block text-slate-500 font-mono font-bold mb-1">Subject Name / Course Title</label>
                        <input
                          type="text"
                          required
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          placeholder="e.g. Computer Science"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 font-mono font-bold mb-1">Course Weight (Weekly Credit Hours)</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          required
                          value={newSubjectCreditHours}
                          onChange={(e) => setNewSubjectCreditHours(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold text-slate-808"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white rounded-xl py-2.5 px-4 shadow font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Integrate Syllabus Course
                      </button>
                    </form>
                  </div>

                </div>
              )}

              {adminSubTab === 'overview' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Enrolled Headcount</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1 font-mono tracking-tight">{students.length} students</div>
                      <div className="text-[10.5px] text-slate-500 mt-1">Spreads over Grade 1 to 10 cohorts</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Average Institution Score</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1 font-mono tracking-tight">
                        {(() => {
                          let sum = 0, count = 0;
                          students.forEach(s => {
                            if (s.grades && s.grades.length > 0) {
                              const average = s.grades.reduce((acc,g) => acc + (g.term1 + g.term2 + g.term3) / 3, 0) / s.grades.length;
                              sum += average;
                              count++;
                            }
                          });
                          return count > 0 ? `${Math.round(sum / count)}%` : 'N/A';
                        })()}
                      </div>
                      <div className="text-[10.5px] text-emerald-600 mt-1 font-bold">Healthy institutional index</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Curricular Courses</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1 font-mono tracking-tight">
                        {(() => {
                          const allSubjects = new Set<string>();
                          students.forEach(s => s.grades?.forEach(g => allSubjects.add(g.subject)));
                          return `${allSubjects.size} Subjects`;
                        })()}
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-1">Compulsory & modular streams</div>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                      <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider font-bold">Total Broadcast Bulletins</div>
                      <div className="text-xl sm:text-2xl font-black text-slate-800 mt-1 font-mono tracking-tight">
                        2 active
                      </div>
                      <div className="text-[10.5px] text-slate-500 mt-1">Live broadcasts on parent side</div>
                    </div>
                  </div>

                  {/* Grid of details of each class (1 through 10) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((gradeNum) => {
                      const classStudents = students.filter(s => s.grade === gradeNum);
                      const uniqueSections = Array.from(new Set(classStudents.map(s => s.section)));
                      const subjectNames = classStudents.length > 0 ? (classStudents[0].grades || []).map(g => g.subject) : [];
                      
                      let avgSum = 0, avgCount = 0;
                      classStudents.forEach(s => {
                        if (s.grades && s.grades.length > 0) {
                          const personalAverage = s.grades.reduce((acc,g) => acc + (g.term1 + g.term2 + g.term3) / 3, 0) / s.grades.length;
                          avgSum += personalAverage;
                          avgCount++;
                        }
                      });
                      const classAvg = avgCount > 0 ? Math.round(avgSum / avgCount) : null;

                      return (
                        <div key={gradeNum} className="bg-white border border-slate-205 rounded-2xl p-4.5 shadow-sm space-y-3 hover:border-amber-250 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-xl font-mono text-xs font-black">
                              Grade {gradeNum} Class
                            </span>
                            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                              {classStudents.length} Students
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs font-semibold leading-relaxed">
                            <div className="flex justify-between text-slate-500">
                              <span>Active Sections:</span>
                              <span className="text-slate-850 font-bold truncate max-w-[150px]">
                                {uniqueSections.length > 0 ? uniqueSections.join(', ') : 'None'}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Total Subjects:</span>
                              <span className="text-slate-850 font-bold">{subjectNames.length} Courses</span>
                            </div>
                            <div className="flex justify-between text-slate-500">
                              <span>Class Academic Index:</span>
                              <span className="font-mono text-indigo-700 font-black">
                                {classAvg !== null ? `${classAvg}%` : 'No data'}
                              </span>
                            </div>
                          </div>

                          {subjectNames.length > 0 && (
                            <div className="pt-2 border-t border-slate-100">
                              <span className="text-[10px] text-slate-450 block font-mono font-bold mb-1 uppercase">Course Load</span>
                              <div className="flex flex-wrap gap-1">
                                {subjectNames.map(sub => (
                                  <span key={sub} className="bg-slate-50 border border-slate-200 text-[9.5px] font-bold text-slate-655 px-1.5 py-0.5 rounded leading-none">
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
