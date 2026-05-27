export interface SubjectGrade {
  subject: string;
  term1: number; // Percentage out of 100
  term2: number; // Percentage out of 100
  term3: number; // Percentage out of 100
  creditHours: number;
}

export interface Student {
  id: string;
  sn: number;
  name: string;
  grade: number; // 1 to 10
  section: string;
  grades: SubjectGrade[];
  aiComment?: string;
  teacherRemarks?: string;
  parentPin?: string; // Pin number for parents/students to log in
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  gradeResponsible: number;
  sectionResponsible: string;
  role: 'teacher' | 'admin';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  authorName: string;
  grade?: number; // Optional, target specific class
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'teacher' | 'parent';
  studentId: string; // Context student
  encryptedText: string; // Standard cipher text simulation
  decryptedText?: string; // Local cached decrypted version
  timestamp: string;
}

export interface Assessment {
  id: string;
  grade: number;
  subject: string;
  term: 'Spring' | 'Fall' | 'Final';
  date: string;
  topic: string;
  task: 'HW' | 'CW' | 'Practical' | 'Project Work' | 'UT' | 'ATT' | 'Discipline' | 'Parental Evaluation' | 'Written Exam';
  fullMarks: number;
  scores: Record<string, string>; // student ID -> score value (e.g. "15", "10", or "-")
}
