import type { CampusDrive, Candidate, Assessment, Question, Interview, Offer, AssessmentSection } from '../types';

class SeededRandom {
  private seed: number;
  constructor(seed: number) {
    this.seed = seed;
  }
  next(): number {
    const x = Math.sin(this.seed++) * 10000;
    return x - Math.floor(x);
  }
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }
  pick<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
}

export interface Database {
  drives: CampusDrive[];
  candidates: Candidate[];
  assessments: Assessment[];
  questions: Question[];
  interviews: Interview[];
  offers: Offer[];
}

const COLLEGES = [
  'IIT Madras', 'IIT Bombay', 'IIT Delhi', 'IIT Kharagpur', 'IIT Roorkee',
  'BITS Pilani', 'NIT Trichy', 'NIT Surathkal', 'VIT Vellore', 'PSG Tech Coimbatore',
  'Amrita Vishwa Vidyapeetham', 'MIT Manipal', 'RV College of Engineering', 'COEP Pune',
  'DTU Delhi', 'NSUT Delhi', 'IIIT Hyderabad', 'IIIT Bangalore', 'Jadavpur University',
  'Anna University', 'SRM University', 'PES University', 'MS Ramaiah Institute', 'BMSCE Bangalore',
  'SSN College of Engineering', 'Sastra University', 'Thapar Institute', 'PEC Chandigarh',
  'VNIT Nagpur', 'MANIT Bhopal', 'MNNIT Allahabad', 'NIT Warangal', 'NIT Calicut',
  'VJTI Mumbai', 'LPU Jalandhar', 'Kalinga Institute', 'Chitkara University', 'Nirma University',
  'LD College of Engineering', 'IIEST Shibpur', 'BIT Mesra', 'Dhirubhai Ambani IICT',
  'Hindustan Institute', 'Sathyabama University', 'Karunya Institute', 'Cochin University',
  'Gitam University', 'KL University', 'VNR Vignana Jyothi', 'CBIT Hyderabad'
];

const FIRST_NAMES = [
  'Amit', 'Rahul', 'Priya', 'Sneha', 'Rajesh', 'Suresh', 'Ramesh', 'Anjali', 'Meera', 'Arjun',
  'Rohit', 'Vijay', 'Vikram', 'Divya', 'Aishwarya', 'Karthik', 'Harish', 'Vignesh', 'Lakshmanan', 'Pooja',
  'Neha', 'Sandeep', 'Deepak', 'Sunil', 'Anil', 'Swati', 'Shreya', 'Abhinav', 'Aditi', 'Yash',
  'Karan', 'Manish', 'Siddharth', 'Varun', 'Gautam', 'Rohan', 'Tanvi', 'Ritu', 'Komal', 'Pranav'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Iyer', 'Nair', 'Reddy', 'Gupta', 'Sen', 'Joshi', 'Verma',
  'Rao', 'Murthy', 'Prasad', 'Mishra', 'Singhal', 'Chawla', 'Gill', 'Mehta', 'Trivedi', 'Bhat',
  'Deshmukh', 'Kulkarni', 'Hegde', 'Pillai', 'Menon', 'Patil', 'Saxena', 'Malhotra', 'Kapoor', 'Das',
  'Dubey', 'Jha', 'Bose', 'Choudhury', 'Banerjee', 'Chatterjee', 'Roy', 'Narayanan', 'Shenoy', 'Prabhu'
];

const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Noida', 'Mumbai', 'Kolkata', 'Coimbatore', 'Delhi'];

const DEGREES = ['B.Tech CSE', 'B.Tech ECE', 'B.Tech IT', 'M.Tech CSE', 'MCA', 'M.Sc Software Engg'];

export function generateMockDatabase(): Database {
  const rnd = new SeededRandom(2026); // Seed to guarantee identical data on first load

  // 1. Generate 500 Questions
  const questions: Question[] = [];
  
  // MCQ/MSQ options templates
  const aptQuestions = [
    { text: 'A train 120 m long passes a telegraph post in 6 seconds. Find the speed of the train in km/hr.', opt: ['72 km/hr', '60 km/hr', '80 km/hr', '90 km/hr'], ans: [0] },
    { text: 'If 15 men can complete a project in 20 days, how many days will 10 men take to complete the same work?', opt: ['30 days', '25 days', '40 days', '15 days'], ans: [0] },
    { text: 'Find the average of all prime numbers between 30 and 50.', opt: ['39.8', '41.2', '38.5', '40.6'], ans: [0] },
    { text: 'What is the compound interest on Rs. 5000 for 2 years at 10% per annum compounded annually?', opt: ['Rs. 1050', 'Rs. 1000', 'Rs. 1100', 'Rs. 1200'], ans: [0] },
    { text: 'A shopkeeper sells an article at a loss of 12.5%. If he sells it for Rs. 92.40 more, he gains 6%. What is the Cost Price?', opt: ['Rs. 500', 'Rs. 520', 'Rs. 480', 'Rs. 550'], ans: [0] }
  ];

  const logQuestions = [
    { text: 'Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?', opt: ['(1/3)', '1/8', '2/8', '1/16'], ans: [1] },
    { text: 'Find the odd one out from the following group.', opt: ['Curd', 'Butter', 'Oil', 'Cheese'], ans: [2] },
    { text: 'Pointing to a photograph, Vipul said, "She is the daughter of my grandfather\'s only son." How is Vipul related to the girl?', opt: ['Brother', 'Uncle', 'Cousin', 'Father'], ans: [0] }
  ];

  const techQuestions = [
    { text: 'Which data structure works on LIFO (Last In First Out) principle?', opt: ['Queue', 'Stack', 'Linked List', 'Tree'], ans: [1] },
    { text: 'What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL Tree)?', opt: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], ans: [2] },
    { text: 'Which of the following is NOT an ACID property in database management systems?', opt: ['Atomicity', 'Consistency', 'Isolation', 'Concurrency'], ans: [3] },
    { text: 'Which layer of the OSI model is responsible for routing packets across networks?', opt: ['Physical Layer', 'Transport Layer', 'Network Layer', 'Data Link Layer'], ans: [2] },
    { text: 'What does the virtual keyword specify in C++?', opt: ['Static binding', 'Dynamic binding', 'Private inheritance', 'Multiple inheritance'], ans: [1] }
  ];

  const codingTemplates = {
    javascript: 'function solve(arr) {\n  // Write your code here\n  return 0;\n}',
    python: 'def solve(arr):\n    # Write your code here\n    return 0',
    java: 'public class Solution {\n    public int solve(int[] arr) {\n        // Write your code here\n        return 0;\n    }\n}',
    csharp: 'public class Solution {\n    public int Solve(int[] arr) {\n        // Write your code here\n        return 0;\n    }\n}'
  };

  const codingQuestions = [
    { text: 'Find the maximum element in a given array of integers. Handles negative and boundary numbers.', topic: 'Coding', difficulty: 'Easy', marks: 10, tags: ['Arrays', 'Algorithms'] },
    { text: 'Reverse a given string in-place without using library functions.', topic: 'Coding', difficulty: 'Easy', marks: 10, tags: ['Strings', 'Recursion'] },
    { text: 'Given an array of integers, find if it contains any duplicates. Return true if duplicate exists.', topic: 'Coding', difficulty: 'Medium', marks: 15, tags: ['Hash Table', 'Arrays'] },
    { text: 'Given a string containing brackets, determine if the input string is valid. Open brackets must be closed by same type.', topic: 'Coding', difficulty: 'Medium', marks: 15, tags: ['Stack', 'Strings'] },
    { text: 'Merge two sorted linked lists and return it as a new sorted list.', topic: 'Coding', difficulty: 'Medium', marks: 20, tags: ['Linked List', 'Sorting'] },
    { text: 'Find the longest palindromic substring in a given string S.', topic: 'Coding', difficulty: 'Hard', marks: 25, tags: ['String', 'Dynamic Programming'] }
  ];

  // Populate 500 questions programmatically
  for (let i = 1; i <= 500; i++) {
    let qType: Question['type'] = 'MCQ';
    let qTopic: Question['topic'] = 'Aptitude';
    let qDiff: Question['difficulty'] = 'Easy';
    let qMarks = 2;
    let qText = '';
    let qOpts: string[] | undefined = undefined;
    let qCorrect: number[] | undefined = undefined;
    let qTags: string[] = [];

    if (i <= 150) {
      // Aptitude MCQs
      qTopic = 'Aptitude';
      qDiff = i % 3 === 0 ? 'Hard' : (i % 3 === 1 ? 'Easy' : 'Medium');
      qMarks = qDiff === 'Easy' ? 1 : (qDiff === 'Medium' ? 2 : 4);
      const baseQ = aptQuestions[(i - 1) % aptQuestions.length];
      qText = `${baseQ.text} (Set Q-${i})`;
      qOpts = [...baseQ.opt];
      qCorrect = [...baseQ.ans];
      qTags = ['Quantitative', 'Math', `Topic-${(i % 5) + 1}`];
    } else if (i <= 250) {
      // Logical Reasoning
      qTopic = 'Logical Reasoning';
      qType = i % 8 === 0 ? 'Multiple Select' : 'MCQ';
      qDiff = i % 2 === 0 ? 'Medium' : 'Easy';
      qMarks = qType === 'Multiple Select' ? 3 : 2;
      const baseQ = logQuestions[(i - 151) % logQuestions.length];
      qText = `${baseQ.text} (Logical Set L-${i})`;
      qOpts = [...baseQ.opt];
      qCorrect = qType === 'Multiple Select' ? [baseQ.ans[0], (baseQ.ans[0] + 1) % 4] : [...baseQ.ans];
      qTags = ['Reasoning', 'Puzzles', `Logical-${i % 4}`];
    } else if (i <= 400) {
      // Technical MCQs
      qTopic = 'Technical';
      qDiff = i % 3 === 0 ? 'Hard' : (i % 3 === 1 ? 'Easy' : 'Medium');
      qMarks = qDiff === 'Easy' ? 2 : (qDiff === 'Medium' ? 3 : 5);
      const baseQ = techQuestions[(i - 251) % techQuestions.length];
      qText = `${baseQ.text} (Tech Core T-${i})`;
      qOpts = [...baseQ.opt];
      qCorrect = [...baseQ.ans];
      qTags = ['Computer Science', 'DBMS', 'DSA', 'OS'];
    } else if (i <= 460) {
      // Coding Challenges
      qType = 'Coding';
      qTopic = 'Coding';
      const baseQ = codingQuestions[(i - 401) % codingQuestions.length];
      qDiff = baseQ.difficulty as Question['difficulty'];
      qMarks = baseQ.marks;
      qText = `${baseQ.text} (Challenge #${i})`;
      qTags = [...baseQ.tags];
    } else {
      // SQL & Descriptive
      qTopic = 'Technical';
      qType = i % 2 === 0 ? 'SQL' : 'Descriptive';
      qDiff = i % 3 === 0 ? 'Hard' : 'Medium';
      qMarks = qType === 'SQL' ? 10 : 15;
      qText = qType === 'SQL' 
        ? `Write a SQL query to find the department name and total employees where average salary exceeds ${(i % 5) * 10000 + 50000} in department table.`
        : `Explain the concept of ${(i % 2 === 0 ? 'Dependency Injection' : 'Garbage Collection')} in modern software design and outline its primary advantages.`;
      qTags = qType === 'SQL' ? ['Database', 'SQL'] : ['Software Engineering', 'Theory'];
    }

    questions.push({
      id: `Q-${1000 + i}`,
      text: qText,
      type: qType,
      topic: qTopic,
      difficulty: qDiff,
      marks: qMarks,
      tags: qTags,
      options: qOpts,
      correctOptions: qCorrect,
      codingTemplate: qType === 'Coding' ? codingTemplates : undefined,
      testCases: qType === 'Coding' ? [
        { input: '[1, 2, 3, 4, 5]', output: '5' },
        { input: '[-10, -5, 0, 100, 2]', output: '100', isSecret: true }
      ] : undefined
    });
  }

  // 2. Generate 50 Campus Drives
  const drives: CampusDrive[] = [];
  for (let i = 1; i <= 50; i++) {
    const college = COLLEGES[i - 1];
    const location = rnd.pick(LOCATIONS);
    const date = new Date(2026, rnd.range(0, 11), rnd.range(1, 28)).toISOString().split('T')[0];
    const target = Math.floor(rnd.range(10, 50));
    const registered = Math.floor(target * rnd.range(5, 12));
    const shortlisted = Math.floor(registered * rnd.range(0.3, 0.5));
    
    // Status distribution
    let status: CampusDrive['status'] = 'Published';
    if (i <= 10) status = 'Completed';
    else if (i <= 15) status = 'Ongoing';
    else if (i <= 20) status = 'Draft';

    drives.push({
      id: `DRV-2026-${100 + i}`,
      name: `${college} Campus Recruitment Drive 2026`,
      college,
      date,
      location,
      targetHiring: target,
      registered,
      shortlisted,
      spocName: `${rnd.pick(FIRST_NAMES)} ${rnd.pick(LAST_NAMES)}`,
      spocContact: `+91 ${Math.floor(rnd.range(7000000000, 9999999999))}`,
      description: `Annual campus placement drive at ${college} for engineering undergraduates and postgraduates across software engineering roles.`,
      status
    });
  }

  // 3. Generate 100 Assessments
  const assessments: Assessment[] = [];
  const assessmentNames = [
    'Software Engineer Elite Hack', 'Technical Graduate Assessment', 'Front End Engineer Test',
    'Full Stack Assessment (Node + React)', 'Java Developer Assessment', 'Python & Data Structures',
    'Aptitude & Logical Sprint', 'Database Developer (SQL)', 'General Technical Aptitude', 'Cloud Engg Core Test'
  ];

  for (let i = 1; i <= 100; i++) {
    const name = `${rnd.pick(assessmentNames)} - V${Math.floor(i / 10) + 1}`;
    const type: Assessment['type'] = i % 4 === 0 ? 'Coding' : (i % 4 === 1 ? 'Aptitude' : (i % 4 === 2 ? 'Technical' : 'Combined'));
    const duration = type === 'Coding' ? 90 : (type === 'Combined' ? 120 : 60);
    
    // Select questions
    const assignedQIds: string[] = [];
    if (type === 'Aptitude') {
      assignedQIds.push(...questions.filter(q => q.topic === 'Aptitude').slice(0, 15).map(q => q.id));
    } else if (type === 'Technical') {
      assignedQIds.push(...questions.filter(q => q.topic === 'Technical').slice(0, 20).map(q => q.id));
    } else if (type === 'Coding') {
      assignedQIds.push(...questions.filter(q => q.topic === 'Coding').slice(0, 3).map(q => q.id));
    } else {
      assignedQIds.push(...questions.filter(q => q.topic === 'Aptitude').slice(0, 5).map(q => q.id));
      assignedQIds.push(...questions.filter(q => q.topic === 'Logical Reasoning').slice(0, 5).map(q => q.id));
      assignedQIds.push(...questions.filter(q => q.topic === 'Technical').slice(0, 10).map(q => q.id));
      assignedQIds.push(...questions.filter(q => q.topic === 'Coding').slice(0, 1).map(q => q.id));
    }

    const totalMarks = questions
      .filter(q => assignedQIds.includes(q.id))
      .reduce((sum, q) => sum + q.marks, 0);

    const sections: AssessmentSection[] = [];
    if (type === 'Combined' || type === 'Aptitude') {
      sections.push({ name: 'Aptitude', questionCount: type === 'Combined' ? 5 : 15, marks: type === 'Combined' ? 10 : 30 });
      sections.push({ name: 'Logical Reasoning', questionCount: type === 'Combined' ? 5 : 0, marks: type === 'Combined' ? 10 : 0 });
    }
    if (type === 'Combined' || type === 'Technical') {
      sections.push({ name: 'Technical', questionCount: type === 'Combined' ? 10 : 20, marks: type === 'Combined' ? 25 : 50 });
    }
    if (type === 'Combined' || type === 'Coding') {
      sections.push({ name: 'Coding', questionCount: type === 'Combined' ? 1 : 3, marks: type === 'Combined' ? 15 : 60 });
    }
    // Filter sections with positive count
    const activeSections = sections.filter(s => s.questionCount > 0);

    assessments.push({
      id: `ASM-${2000 + i}`,
      name,
      type,
      duration,
      totalMarks,
      candidatesAssignedCount: 0, // Computed later
      status: i <= 80 ? 'Active' : (i <= 90 ? 'Draft' : 'Closed'),
      sections: activeSections,
      questionIds: assignedQIds
    });
  }

  // 4. Generate 1000 Candidates
  const candidates: Candidate[] = [];
  const interviews: Interview[] = [];
  const offers: Offer[] = [];

  for (let i = 1; i <= 1000; i++) {
    const drive = drives[i % drives.length];
    const name = `${FIRST_NAMES[i % FIRST_NAMES.length]} ${LAST_NAMES[(i * 3) % LAST_NAMES.length]}`;
    const cleanEmailName = name.toLowerCase().replace(/\s+/g, '.');
    const degree = rnd.pick(DEGREES);
    const cgpa = parseFloat(rnd.range(6.5, 9.8).toFixed(2));
    
    // Distribute candidate funnel stages
    // 60% Applied, 22% Online Test, 10% Interview, 5% Offered, 3% Joined
    let funnelStage: Candidate['funnelStage'] = 'Applied';
    let assessmentStatus: Candidate['assessmentStatus'] = 'Not Invited';
    let interviewStatus: Candidate['interviewStatus'] = 'Not Scheduled';
    let offerStatus: Candidate['offerStatus'] = 'None';
    
    const roll = rnd.range(0, 100);
    
    let targetAssessment = assessments[i % assessments.length];
    let assessmentScore: number | undefined = undefined;
    let sectionScores: Candidate['sectionScores'] = undefined;
    let durationUsed: number | undefined = undefined;
    let submissionDate: string | undefined = undefined;
    let assessmentPassword = `PRES${Math.floor(rnd.range(1000, 9999))}`;

    if (roll < 40) {
      funnelStage = 'Applied';
      assessmentStatus = 'Not Invited';
    } else if (roll < 60) {
      funnelStage = 'Applied';
      assessmentStatus = 'Pending';
    } else if (roll < 82) {
      funnelStage = 'Online Test';
      // Some are in progress, some completed
      if (roll < 72) {
        assessmentStatus = 'Completed';
        // Compute realistic score
        assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.3, 0.95));
        durationUsed = Math.floor(targetAssessment.duration * 60 * rnd.range(0.5, 0.95));
        submissionDate = new Date(2026, 4, Math.floor(rnd.range(1, 28))).toISOString();
        sectionScores = {
          aptitude: Math.floor(targetAssessment.totalMarks * 0.2 * rnd.range(0.3, 0.9)),
          technical: Math.floor(targetAssessment.totalMarks * 0.5 * rnd.range(0.4, 0.95)),
          coding: rnd.next() > 0.4 ? Math.floor(targetAssessment.totalMarks * 0.3 * rnd.range(0.2, 0.9)) : 0
        };
      } else {
        assessmentStatus = 'InProgress';
      }
    } else if (roll < 92) {
      // Interviews stage
      const stageOptions: Candidate['funnelStage'][] = ['Interview', 'Coding Exercise', 'Whiteboard Interview'];
      funnelStage = rnd.pick(stageOptions);
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.65, 0.98));
      sectionScores = {
        aptitude: Math.floor(targetAssessment.totalMarks * 0.25 * rnd.range(0.7, 0.95)),
        technical: Math.floor(targetAssessment.totalMarks * 0.45 * rnd.range(0.75, 0.98)),
        coding: Math.floor(targetAssessment.totalMarks * 0.3 * rnd.range(0.65, 0.95))
      };
      
      interviewStatus = roll < 87 ? 'Scheduled' : 'Ongoing';
      
      // Schedule an interview
      const idStr = `INT-2026-${1000 + i}`;
      interviews.push({
        id: idStr,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        panelName: `Panel ${rnd.pick(['Alpha', 'Beta', 'Gamma', 'Delta'])}`,
        date: new Date(2026, 5, Math.floor(rnd.range(15, 25))).toISOString().split('T')[0],
        time: `${Math.floor(rnd.range(10, 16))}:00`,
        stage: funnelStage === 'Interview' ? 'Interview' : (funnelStage === 'Coding Exercise' ? 'Coding Exercise' : 'Whiteboard Interview'),
        status: interviewStatus === 'Scheduled' ? 'Scheduled' : 'Completed',
        feedback: interviewStatus === 'Ongoing' ? 'Candidate performed well in logical section. Currently conducting coding round.' : undefined,
        rating: interviewStatus === 'Ongoing' ? 4 : undefined
      });

    } else if (roll < 97) {
      // Offered
      funnelStage = 'Offered';
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.75, 0.98));
      interviewStatus = 'Passed';
      
      const offerRoll = rnd.range(0, 3);
      if (offerRoll < 1) offerStatus = 'Offered';
      else if (offerRoll < 2) offerStatus = 'Accepted';
      else offerStatus = 'Declined';

      const offerId = `OFF-2026-${200 + i}`;
      const ctc = parseFloat(rnd.range(6.0, 18.0).toFixed(1));
      offers.push({
        id: offerId,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        college: drive.college,
        ctc,
        status: offerStatus as Offer['status'],
        dateReleased: new Date(2026, 5, Math.floor(rnd.range(1, 10))).toISOString().split('T')[0]
      });

    } else {
      // Joined
      funnelStage = 'Joined';
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.8, 0.99));
      interviewStatus = 'Passed';
      offerStatus = 'Joined';

      const offerId = `OFF-2026-${200 + i}`;
      const ctc = parseFloat(rnd.range(8.0, 24.0).toFixed(1));
      offers.push({
        id: offerId,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        college: drive.college,
        ctc,
        status: 'Joined',
        dateReleased: new Date(2026, 4, Math.floor(rnd.range(1, 15))).toISOString().split('T')[0],
        joiningDate: new Date(2026, 5, 15).toISOString().split('T')[0]
      });
    }

    candidates.push({
      id: `PRES2026-${10000 + i}`,
      name,
      college: drive.college,
      degree,
      cgpa,
      email: `${cleanEmailName}@${drive.college.toLowerCase().replace(/\s+/g, '')}.edu.in`,
      phone: `+91 ${Math.floor(rnd.range(8000000000, 9999999999))}`,
      assessmentStatus,
      assessmentPassword,
      assessmentId: targetAssessment.id,
      assessmentScore,
      assessmentDurationUsed: durationUsed,
      assessmentSubmissionDate: submissionDate,
      sectionScores,
      interviewStatus,
      offerStatus,
      funnelStage
    });

    // Increment assigned candidates count in assessment
    targetAssessment.candidatesAssignedCount++;
  }

  // Calculate ranks and percentiles for completed assessments
  const completedCandidates = candidates.filter(c => c.assessmentStatus === 'Completed');
  assessments.forEach(asm => {
    const asmCandidates = completedCandidates.filter(c => c.assessmentId === asm.id);
    asmCandidates.sort((a, b) => (b.assessmentScore || 0) - (a.assessmentScore || 0));
    
    asmCandidates.forEach((c, idx) => {
      c.assessmentRank = idx + 1;
      const count = asmCandidates.length;
      c.assessmentPercentile = count > 1 
        ? parseFloat((((count - (idx + 1)) / (count - 1)) * 100).toFixed(1))
        : 100.0;
    });
  });

  return {
    drives,
    candidates,
    assessments,
    questions,
    interviews,
    offers
  };
}

export function getDatabase(): Database {
  const data = localStorage.getItem('presidio_talent_hub_db');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse database from localStorage, re-seeding.', e);
    }
  }
  const db = generateMockDatabase();
  saveDatabase(db);
  return db;
}

export function saveDatabase(db: Database): void {
  localStorage.setItem('presidio_talent_hub_db', JSON.stringify(db));
  // Fire event to notify context of updates
  window.dispatchEvent(new CustomEvent('presidio-db-updated', { detail: db }));
}

export function resetDatabase(): Database {
  localStorage.removeItem('presidio_talent_hub_db');
  return getDatabase();
}
