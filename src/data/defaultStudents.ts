import { Student, SubjectGrade } from '../types';

const defaultSubjects = [
  { name: 'English', creditHours: 4 },
  { name: 'Nepali', creditHours: 4 },
  { name: 'Mathematics', creditHours: 4 },
  { name: 'Science', creditHours: 4 },
  { name: 'Social Studies', creditHours: 3 },
  { name: 'ICT', creditHours: 2 }
];

function generateGrades(studentIndex: number): SubjectGrade[] {
  // Generate slightly different realistic grades for different students
  return defaultSubjects.map((sub, idx) => {
    const base = 70 + (studentIndex * 7 + idx * 13) % 26; // Score between 70 and 96
    return {
      subject: sub.name,
      term1: Math.min(100, Math.max(50, base - 5)),
      term2: Math.min(100, Math.max(50, base + (studentIndex % 3 === 0 ? 3 : -2))),
      term3: Math.min(100, Math.max(50, base + (studentIndex % 2 === 0 ? 4 : 2))),
      creditHours: sub.creditHours
    };
  });
}

const rawGrade1Students = [
  { sn: 1, name: "Aadhira Giri", section: "I - Butterfly" },
  { sn: 2, name: "Aakriti Mishra", section: "I - Bumble Bee" },
  { sn: 3, name: "Adhrit Jung Thapa", section: "I - Butterfly" },
  { sn: 4, name: "Aira Kafle", section: "I - Bumble Bee" },
  { sn: 5, name: "Alexa Shiwakoti", section: "I - Bumble Bee" },
  { sn: 6, name: "Alvina Ghimire", section: "I - Bumble Bee" },
  { sn: 7, name: "amay karmarcharya", section: "I - Bumble Bee" },
  { sn: 8, name: "Ashaya Devkota", section: "I - Butterfly" },
  { sn: 9, name: "Avishka Subedi", section: "I - Butterfly" },
  { sn: 10, name: "Darsh Bikram Khatri", section: "I - Butterfly" },
  { sn: 11, name: "Ishan Dhoj Karki", section: "I - Bumble Bee" },
  { sn: 12, name: "Kritan Shrestha", section: "I - Bumble Bee" },
  { sn: 13, name: "Lipsana Bhele", section: "I - Bumble Bee" },
  { sn: 14, name: "Medansh Ghatane", section: "I - Butterfly" },
  { sn: 15, name: "Myra Khatiwada", section: "I - Butterfly" },
  { sn: 16, name: "Niswana Maharjan", section: "I - Butterfly" },
  { sn: 17, name: "Pariska Kutu", section: "I - Bumble Bee" },
  { sn: 18, name: "prabhab dhungel", section: "I - Butterfly" },
  { sn: 19, name: "Sarwashree Rajyashwori Malla", section: "I - Bumble Bee" },
  { sn: 20, name: "Siya Gosai", section: "I - Butterfly" },
  { sn: 21, name: "Siyon Shrestha", section: "I - Butterfly" },
  { sn: 22, name: "Sridh Thapa", section: "I - Butterfly" },
  { sn: 23, name: "Sumedh Raj Subedi", section: "I - Bumble Bee" },
  { sn: 24, name: "Suresha karki", section: "I - Butterfly" },
  { sn: 25, name: "Suvani Phuyal", section: "I - Bumble Bee" }
];

export const defaultStudents: Student[] = [
  // Grade 1 students from the list
  ...rawGrade1Students.map((s, idx) => ({
    id: `G1-S${s.sn}`,
    sn: s.sn,
    name: s.name,
    grade: 1,
    section: s.section.endsWith("Butterfly") ? "Butterfly" : "Bumble Bee",
    grades: generateGrades(idx + 1),
    parentPin: `${1000 + s.sn}`,
    teacherRemarks: `Excellent participation and consistent focus. Shown great skills in team activities.`,
    aiComment: `Aadhira shows an exceptional grasp of subject concepts, particularly in ${defaultSubjects[idx % defaultSubjects.length].name}. For term 3, we recommend maintaining this active, inquisitive learning style.`
  })),

  // Adding other Grades (2 to 10) to support the centralized system requested
  {
    id: `G2-S1`,
    sn: 1,
    name: "Rohan Adhikari",
    grade: 2,
    section: "A",
    grades: generateGrades(2),
    parentPin: "2001",
    teacherRemarks: "Rohan is curious and has made notable progress this semester."
  },
  {
    id: `G5-S1`,
    sn: 1,
    name: "Sneha Shrestha",
    grade: 5,
    section: "Redwoods",
    grades: generateGrades(3),
    parentPin: "5001",
    teacherRemarks: "Sneha exhibits strong leadership skills and excels in Science."
  },
  {
    id: `G8-S1`,
    sn: 1,
    name: "Ankit Thapa",
    grade: 8,
    section: "Sagarmatha",
    grades: generateGrades(4),
    parentPin: "8001",
    teacherRemarks: "Excellent analytical capacity, highly active in Mathematics."
  },
  {
    id: `G10-S1`,
    sn: 1,
    name: "Pooja Gurung",
    grade: 10,
    section: "Mount Everest",
    grades: generateGrades(5),
    parentPin: "1001",
    teacherRemarks: "Consistently excellent scores. Highly diligent and destined for great achievements in board exams."
  }
];

export const defaultAnnouncements = [
  {
    id: 'ann-1',
    title: 'First Terminal Evaluation Reports Released',
    content: 'Dear Parents, please log in with your assigned Student ID and PIN to view the customized First Terminal Academic Reports and constructive feedback.',
    date: 'Wednesday, May 27, 2026',
    authorName: 'Principal Office'
  },
  {
    id: 'ann-2',
    title: 'Science & ICT Exhibition Next Week',
    content: 'We are thrilled to announce Grade 1-10 students will be presenting their Science Models and Interactive computer programs during the Annual Exhibition.',
    date: 'Monday, May 25, 2026',
    authorName: 'Academic Coordinator'
  }
];
