import type { CampusDrive, Candidate, Assessment, Question, Interview, Offer, AssessmentSection } from '../types';
import { generateSlug } from '../lib/utils';

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

const DRIVE_DATA: { college: string; year: number }[] = [
  // 2020 — 16 drives
  { college: 'R.M.K. Group of Colleges',                               year: 2020 },
  { college: 'Kongu Engineering College',                               year: 2020 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2020 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2020 },
  { college: 'Velammal College of Engineering and Technology',          year: 2020 },
  { college: 'Sastra Deemed University',                                year: 2020 },
  { college: 'Coimbatore Institute of Technology',                      year: 2020 },
  { college: 'IMS Engineering College',                                 year: 2020 },
  { college: 'KGiSL College',                                          year: 2020 },
  { college: 'Kumaraguru College of Technology',                        year: 2020 },
  { college: 'SIBAR, Pune',                                            year: 2020 },
  { college: 'SSN College of Engineering',                              year: 2020 },
  { college: 'TCS College',                                            year: 2020 },
  { college: 'Thiagarajar College of Engineering',                      year: 2020 },
  { college: 'NIT Trichy',                                             year: 2020 },
  { college: 'PSG College of Arts and Science',                         year: 2020 },
  // 2021 — 17 drives
  { college: 'R.M.K. Group of Colleges',                               year: 2021 },
  { college: 'Kongu Engineering College',                               year: 2021 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2021 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2021 },
  { college: 'Velammal College of Engineering and Technology',          year: 2021 },
  { college: 'Sastra Deemed University',                                year: 2021 },
  { college: 'Coimbatore Institute of Technology',                      year: 2021 },
  { college: 'Kumaraguru College of Technology',                        year: 2021 },
  { college: 'SSN College of Engineering',                              year: 2021 },
  { college: 'Sri Eshwar College of Engineering',                       year: 2021 },
  { college: 'Meenakshi Sundararajan Engineering College',              year: 2021 },
  { college: 'Institute of Computer Technology, Ganpat University',     year: 2021 },
  { college: 'Pondicherry University',                                  year: 2021 },
  { college: 'Rajalakshmi College of Engineering and Technology',       year: 2021 },
  { college: 'Sri Ramakrishna Institute of Technology',                 year: 2021 },
  { college: 'Maharaja Institute of Technology Mysore',                 year: 2021 },
  { college: "St. Joseph's College of Engineering and Technology",      year: 2021 },
  // 2022 — 13 drives
  { college: 'R.M.K. Group of Colleges',                               year: 2022 },
  { college: 'Kongu Engineering College',                               year: 2022 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2022 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2022 },
  { college: 'Velammal College of Engineering and Technology',          year: 2022 },
  { college: 'Sastra Deemed University',                                year: 2022 },
  { college: 'Loyola ICAM',                                            year: 2022 },
  { college: 'Chennai Institute of Technologies',                       year: 2022 },
  { college: 'SA Engineering College',                                  year: 2022 },
  { college: 'Saveetha Engineering College',                            year: 2022 },
  { college: 'SNS College of Technology',                               year: 2022 },
  { college: 'Sona College of Technology',                              year: 2022 },
  { college: 'Sathyabama Institute of Science and Technology',          year: 2022 },
  // 2023 — 16 drives
  { college: 'R.M.K. Group of Colleges',                               year: 2023 },
  { college: 'Kongu Engineering College',                               year: 2023 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2023 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2023 },
  { college: 'Velammal College of Engineering and Technology',          year: 2023 },
  { college: 'Sastra Deemed University',                                year: 2023 },
  { college: 'Sri Eshwar College of Engineering',                       year: 2023 },
  { college: 'Saveetha Engineering College',                            year: 2023 },
  { college: 'SNS College of Technology',                               year: 2023 },
  { college: 'NIT Trichy',                                             year: 2023 },
  { college: 'Sona College of Technology',                              year: 2023 },
  { college: 'NIT Warangal (Prograd - Chennai)',                        year: 2023 },
  { college: 'Sathyabama Institute of Science and Technology',          year: 2023 },
  { college: 'Meenakshi Sundararajan Engineering College',              year: 2023 },
  { college: "St. Joseph's College of Engineering and Technology",      year: 2023 },
  { college: 'Rajalakshmi College of Engineering and Technology',       year: 2023 },
  // 2024 — 15 drives
  { college: 'R.M.K. Group of Colleges',                               year: 2024 },
  { college: 'Kongu Engineering College',                               year: 2024 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2024 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2024 },
  { college: 'Velammal College of Engineering and Technology',          year: 2024 },
  { college: 'Sastra Deemed University',                                year: 2024 },
  { college: 'SSN College of Engineering',                              year: 2024 },
  { college: 'Sri Eshwar College of Engineering',                       year: 2024 },
  { college: 'Loyola ICAM',                                            year: 2024 },
  { college: 'Chennai Institute of Technologies',                       year: 2024 },
  { college: 'Meenakshi Sundararajan Engineering College',              year: 2024 },
  { college: "St. Joseph's College of Engineering and Technology",      year: 2024 },
  { college: 'Rajalakshmi College of Engineering and Technology',       year: 2024 },
  { college: 'Sri Shakthi Institute of Engineering and Technology',     year: 2024 },
  { college: 'Erode Sengunthar Engineering College',                    year: 2024 },
  // 2025 — 16 drives
  { college: 'Kongu Engineering College',                               year: 2025 },
  { college: 'Sri Eshwar College of Engineering',                       year: 2025 },
  { college: 'Bannari Amman Institute of Technology',                   year: 2025 },
  { college: 'Sri Krishna College of Engineering & Technology',         year: 2025 },
  { college: "St. Joseph's Engineering College - Chennai",              year: 2025 },
  { college: 'Meenakshi Sundararajan College',                          year: 2025 },
  { college: 'Velammal Groups of College',                              year: 2025 },
  { college: 'Sastra Deemed University - Thanjavur',                    year: 2025 },
  { college: 'Vellore Institute of Technology',                         year: 2025 },
  { college: 'Sri Sivasubramaniya Nadar College of Engineering',        year: 2025 },
  { college: 'Pool Drive',                                              year: 2025 },
  { college: 'RV College of Engineering',                               year: 2025 },
  { college: 'Jawaharlal Nehru Technological University',               year: 2025 },
  { college: 'New Horizon College of Engineering',                      year: 2025 },
  { college: 'Anna University',                                         year: 2025 },
  { college: 'Pooled Drive - Hyderabad',                                year: 2025 },
  // 2026 — 11 drives
  { college: 'Kongu Engineering College, Erode',                        year: 2026 },
  { college: 'BIT, KPR, Karpagam & Hindustan',                         year: 2026 },
  { college: "St. Joseph's College, Chennai",                           year: 2026 },
  { college: 'Sri Eshwar College, Coimbatore',                          year: 2026 },
  { college: 'Amrita Vidya Peetham, Chennai (PRIME)',                   year: 2026 },
  { college: 'New Horizon College, Bangalore',                          year: 2026 },
  { college: 'CIT College, Chennai',                                    year: 2026 },
  { college: 'Sri Krishna, KIT & Sri Sakthi',                           year: 2026 },
  { college: 'KL University, Hyderabad',                                year: 2026 },
  { college: 'Rajalakshmi Engineering College',                         year: 2026 },
  { college: 'Pooled Drive - Velammal, MSN, Saveetha & LICT',          year: 2026 },
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

export const LOCATIONS = ['Chennai', 'Bangalore', 'Hyderabad', 'Pune', 'Noida', 'Mumbai', 'Kolkata', 'Coimbatore', 'Delhi'];

const DEGREES = ['B.Tech CSE', 'B.Tech ECE', 'B.Tech IT', 'M.Tech CSE', 'MCA', 'M.Sc Software Engg'];


const CTC_STEPS = [7.0, 7.5, 8.0, 9.0, 10.0, 11.0, 12.0, 14.0, 16.0, 18.0];
const JOINED_CTC_STEPS = [10.0, 12.0, 14.0, 16.0, 18.0, 20.0, 22.0, 24.0];

const DRIVE_DESCRIPTIONS = [
  (college: string) => `Campus placement drive at ${college} targeting software engineering, backend development, and data science roles for final-year B.Tech and M.Tech students.`,
  (college: string) => `Product engineering recruitment at ${college} for full-stack, mobile, and frontend roles. We are building the next generation of Presidio's SaaS platform.`,
  (college: string) => `Cloud and DevOps talent drive at ${college}. Seeking engineers with strong fundamentals in infrastructure, CI/CD, and distributed systems for our platform team.`,
  (college: string) => `Core engineering drive at ${college} focused on backend systems, API design, and high-scale distributed computing. Roles across SDE-1 and SDE-2 levels.`,
];

const INTERVIEW_FEEDBACK = [
  'Strong problem-solving approach. Implemented the optimal solution with correct edge-case handling on the first attempt.',
  'Good system design fundamentals. Clearly explained trade-offs between relational and NoSQL databases for the given use case.',
  'Solid DSA knowledge. Reversed a linked list in-place with O(1) space and articulated the time complexity accurately.',
  'Impressive understanding of OOP concepts. Demonstrated SOLID principles with concrete real-world examples.',
  'Handled all edge cases well during the coding round. SQL subquery optimisation was near-perfect.',
  'Strong analytical thinking. Arrived at the optimal complexity with minor guidance; communication was clear throughout.',
  'Well-versed with microservices patterns. Proposed a sensible approach to service decomposition for the design problem.',
  'Good grasp of OS fundamentals — explained process scheduling and memory management correctly under pressure.',
];

export function generateMockDatabase(): Database {
  const rnd = new SeededRandom(2026); // Seed to guarantee identical data on first load

  // 1. Generate 500 Questions
  const questions: Question[] = [];

  const aptQuestions = [
    { text: 'A train 120 m long passes a telegraph post in 6 seconds. Find the speed of the train in km/hr.', opt: ['72 km/hr', '60 km/hr', '80 km/hr', '90 km/hr'], ans: [0] },
    { text: 'If 15 men can complete a project in 20 days, how many days will 10 men take to complete the same work?', opt: ['30 days', '25 days', '40 days', '15 days'], ans: [0] },
    { text: 'Find the average of all prime numbers between 30 and 50.', opt: ['39.8', '41.2', '38.5', '40.6'], ans: [0] },
    { text: 'What is the compound interest on Rs. 5000 for 2 years at 10% per annum compounded annually?', opt: ['Rs. 1050', 'Rs. 1000', 'Rs. 1100', 'Rs. 1200'], ans: [0] },
    { text: 'A shopkeeper sells an article at a loss of 12.5%. If he sells it for Rs. 92.40 more, he gains 6%. What is the Cost Price?', opt: ['Rs. 500', 'Rs. 520', 'Rs. 480', 'Rs. 550'], ans: [0] },
    { text: 'What percentage of 450 is 90?', opt: ['20%', '25%', '18%', '15%'], ans: [0] },
    { text: 'The average age of 5 students is 16 years. If one student aged 20 joins the group, what is the new average age?', opt: ['16.67 years', '17 years', '16 years', '18 years'], ans: [0] },
    { text: 'Pipe A can fill a tank in 12 hours and Pipe B can fill it in 18 hours. How long will both pipes together take to fill the tank?', opt: ['7.2 hours', '8 hours', '6 hours', '9 hours'], ans: [0] },
    { text: 'The LCM of two numbers is 120 and their HCF is 10. If one number is 40, find the other.', opt: ['30', '25', '20', '15'], ans: [0] },
    { text: 'A boat travels 36 km downstream in 2 hours and 24 km upstream in 4 hours. Find the speed of the stream.', opt: ['3 km/hr', '4 km/hr', '5 km/hr', '6 km/hr'], ans: [0] },
  ];

  const logQuestions = [
    { text: 'Look at this series: 2, 1, 1/2, 1/4, ... What number should come next?', opt: ['1/3', '1/8', '2/8', '1/16'], ans: [1] },
    { text: 'Find the odd one out: Curd, Butter, Oil, Cheese.', opt: ['Curd', 'Butter', 'Oil', 'Cheese'], ans: [2] },
    { text: 'Pointing to a photograph, Vipul said, "She is the daughter of my grandfather\'s only son." How is Vipul related to the girl?', opt: ['Brother', 'Uncle', 'Cousin', 'Father'], ans: [0] },
    { text: 'In a coding scheme, MANGO is written as NBOHP. How is APPLE written in that scheme?', opt: ['BQQMF', 'BQPMF', 'CQQMG', 'BPQMF'], ans: [0] },
    { text: 'A is the father of B. C is the mother of B. D is the brother of A. How is D related to B?', opt: ['Uncle', 'Cousin', 'Brother', 'Grandfather'], ans: [0] },
    { text: 'Ravi walks 5 km north, then turns right and walks 3 km, then turns right and walks 5 km. How far is he from the starting point?', opt: ['3 km', '5 km', '8 km', '0 km'], ans: [0] },
    { text: 'All roses are flowers. Some flowers fade quickly. Which conclusion is correct?', opt: ['All roses fade quickly', 'Some roses may fade quickly', 'No rose fades quickly', 'All flowers are roses'], ans: [1] },
    { text: 'Find the next term in the series: AZ, BY, CX, DW, ?', opt: ['EU', 'EV', 'FV', 'EX'], ans: [1] },
  ];

  const techQuestions = [
    { text: 'Which data structure works on LIFO (Last In First Out) principle?', opt: ['Queue', 'Stack', 'Linked List', 'Tree'], ans: [1] },
    { text: 'What is the worst-case time complexity of searching in a Balanced Binary Search Tree (AVL Tree)?', opt: ['O(1)', 'O(n)', 'O(log n)', 'O(n log n)'], ans: [2] },
    { text: 'Which of the following is NOT an ACID property in database management systems?', opt: ['Atomicity', 'Consistency', 'Isolation', 'Concurrency'], ans: [3] },
    { text: 'Which layer of the OSI model is responsible for routing packets across networks?', opt: ['Physical Layer', 'Transport Layer', 'Network Layer', 'Data Link Layer'], ans: [2] },
    { text: 'What does the virtual keyword specify in C++?', opt: ['Static binding', 'Dynamic binding', 'Private inheritance', 'Multiple inheritance'], ans: [1] },
    { text: 'In a singly linked list, what is the time complexity of deleting a node when its pointer is given?', opt: ['O(1)', 'O(n)', 'O(log n)', 'O(n²)'], ans: [1] },
    { text: 'Which sorting algorithm has the best average-case time complexity?', opt: ['Bubble Sort', 'Selection Sort', 'Merge Sort', 'Insertion Sort'], ans: [2] },
    { text: 'What is the 3rd Normal Form (3NF) in database design concerned with?', opt: ['Eliminating partial dependencies', 'Eliminating transitive dependencies', 'Eliminating multi-valued dependencies', 'Ensuring atomic values'], ans: [1] },
    { text: 'Which of the following is a necessary condition for a deadlock to occur?', opt: ['Mutual Exclusion', 'No Preemption', 'Circular Wait', 'All of the above'], ans: [3] },
    { text: 'In TCP/IP, which protocol is responsible for reliable, ordered delivery of data?', opt: ['UDP', 'IP', 'TCP', 'ICMP'], ans: [2] },
    { text: 'Which OOP principle allows a subclass to provide a specific implementation of a method already defined in the parent class?', opt: ['Encapsulation', 'Abstraction', 'Method Overloading', 'Method Overriding'], ans: [3] },
    { text: 'What is the time complexity of inserting an element into a max-heap?', opt: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'], ans: [1] },
  ];

  const codingTemplates = {
    javascript: 'function solve(arr) {\n  // Write your code here\n  return 0;\n}',
    python: 'def solve(arr):\n    # Write your code here\n    return 0',
    java: 'public class Solution {\n    public int solve(int[] arr) {\n        // Write your code here\n        return 0;\n    }\n}',
    csharp: 'public class Solution {\n    public int Solve(int[] arr) {\n        // Write your code here\n        return 0;\n    }\n}'
  };

  const codingQuestions = [
    {
      text: 'Find the maximum element in a given array of integers. Handle negative numbers and single-element arrays.',
      title: 'Maximum Array Element',
      skill: 'Arrays',
      estimatedTime: 10,
      difficulty: 'Easy', marks: 10, tags: ['Arrays', 'Algorithms'],
      functionName: 'findMax',
      functionParams: [
        { name: 'n', type: 'INTEGER', description: 'The size of the array' },
        { name: 'arr', type: 'INTEGER ARRAY', description: 'The input array of integers' },
      ],
      returnType: 'INTEGER',
      returnDescription: 'the maximum element in the array',
      constraints: ['1 ≤ n ≤ 10⁵', '-10⁹ ≤ arr[i] ≤ 10⁹'],
    },
    {
      text: 'Reverse a given string in-place without using built-in reverse functions.',
      title: 'In-Place String Reversal',
      skill: 'Strings',
      estimatedTime: 10,
      difficulty: 'Easy', marks: 10, tags: ['Strings', 'Two Pointers'],
      functionName: 'reverseString',
      functionParams: [
        { name: 's', type: 'STRING', description: 'The string to reverse' },
      ],
      returnType: 'STRING',
      returnDescription: 'the reversed string',
      constraints: ['1 ≤ |s| ≤ 10⁵', 's contains only printable ASCII characters'],
    },
    {
      text: 'Given an array of integers, determine if it contains any duplicate values.',
      title: 'Contains Duplicate',
      skill: 'Hash Table',
      estimatedTime: 10,
      difficulty: 'Easy', marks: 10, tags: ['Hash Table', 'Arrays'],
      functionName: 'containsDuplicate',
      functionParams: [
        { name: 'n', type: 'INTEGER', description: 'The size of the array' },
        { name: 'arr', type: 'INTEGER ARRAY', description: 'The input array' },
      ],
      returnType: 'BOOLEAN',
      returnDescription: 'true if any value appears at least twice, false otherwise',
      constraints: ['1 ≤ n ≤ 10⁵', '-10⁹ ≤ arr[i] ≤ 10⁹'],
    },
    {
      text: 'Given a string containing only brackets ( ), [ ], { }, determine if the brackets are balanced and valid.',
      title: 'Valid Bracket Sequence',
      skill: 'Stack',
      estimatedTime: 15,
      difficulty: 'Medium', marks: 15, tags: ['Stack', 'Strings'],
      functionName: 'isValid',
      functionParams: [
        { name: 's', type: 'STRING', description: 'The bracket string to validate' },
      ],
      returnType: 'BOOLEAN',
      returnDescription: 'true if the bracket sequence is valid, false otherwise',
      constraints: ['1 ≤ |s| ≤ 10⁴', 's consists only of parentheses (), square brackets [], and curly braces {}'],
    },
    {
      text: 'Merge two sorted arrays into a single sorted array without using extra space.',
      title: 'Merge Sorted Arrays',
      skill: 'Two Pointers',
      estimatedTime: 15,
      difficulty: 'Medium', marks: 15, tags: ['Arrays', 'Sorting', 'Two Pointers'],
      functionName: 'mergeSorted',
      functionParams: [
        { name: 'm', type: 'INTEGER', description: 'Size of the first array' },
        { name: 'a', type: 'INTEGER ARRAY', description: 'First sorted array' },
        { name: 'n', type: 'INTEGER', description: 'Size of the second array' },
        { name: 'b', type: 'INTEGER ARRAY', description: 'Second sorted array' },
      ],
      returnType: 'INTEGER ARRAY',
      returnDescription: 'the merged sorted array',
      constraints: ['0 ≤ m, n ≤ 2 × 10⁴', '-10⁹ ≤ a[i], b[i] ≤ 10⁹', 'Both arrays are sorted in non-decreasing order'],
    },
    {
      text: 'Find the longest palindromic substring in a given string.',
      title: 'Longest Palindromic Substring',
      skill: 'Dynamic Programming',
      estimatedTime: 25,
      difficulty: 'Hard', marks: 25, tags: ['String', 'Dynamic Programming'],
      functionName: 'longestPalindrome',
      functionParams: [
        { name: 's', type: 'STRING', description: 'The input string' },
      ],
      returnType: 'STRING',
      returnDescription: 'the longest palindromic substring in s',
      constraints: ['1 ≤ |s| ≤ 1000', 's consists of only lowercase English letters'],
    },
    {
      text: 'Given an integer array, return the indices of the two numbers that add up to a specific target.',
      title: 'Two Sum',
      skill: 'Hash Table',
      estimatedTime: 10,
      difficulty: 'Easy', marks: 10, tags: ['Hash Table', 'Arrays'],
      functionName: 'twoSum',
      functionParams: [
        { name: 'n', type: 'INTEGER', description: 'Size of the array' },
        { name: 'nums', type: 'INTEGER ARRAY', description: 'The input array of integers' },
        { name: 'target', type: 'INTEGER', description: 'The target sum' },
      ],
      returnType: 'INTEGER ARRAY',
      returnDescription: 'indices [i, j] such that nums[i] + nums[j] == target',
      constraints: ['2 ≤ n ≤ 10⁴', '-10⁹ ≤ nums[i] ≤ 10⁹', 'Exactly one valid answer exists'],
    },
    {
      text: 'Implement a function to check if a given binary tree is a valid Binary Search Tree.',
      title: 'Validate Binary Search Tree',
      skill: 'Binary Tree',
      estimatedTime: 20,
      difficulty: 'Medium', marks: 20, tags: ['Binary Tree', 'DFS', 'BST'],
      functionName: 'isValidBST',
      functionParams: [
        { name: 'root', type: 'TREE NODE', description: 'Root of the binary tree' },
      ],
      returnType: 'BOOLEAN',
      returnDescription: 'true if the tree is a valid BST, false otherwise',
      constraints: ['Number of nodes: 1 ≤ n ≤ 10⁴', '-2³¹ ≤ Node.val ≤ 2³¹ − 1'],
    },
    {
      text: 'Find the minimum number of coins needed to make a given amount using dynamic programming.',
      title: 'Coin Change',
      skill: 'Dynamic Programming',
      estimatedTime: 20,
      difficulty: 'Medium', marks: 20, tags: ['Dynamic Programming', 'Greedy'],
      functionName: 'coinChange',
      functionParams: [
        { name: 'n', type: 'INTEGER', description: 'Number of coin denominations' },
        { name: 'coins', type: 'INTEGER ARRAY', description: 'Available coin denominations' },
        { name: 'amount', type: 'INTEGER', description: 'The target amount' },
      ],
      returnType: 'INTEGER',
      returnDescription: 'fewest coins needed to make up amount, or -1 if impossible',
      constraints: ['1 ≤ n ≤ 12', '1 ≤ coins[i] ≤ 2³¹ − 1', '0 ≤ amount ≤ 10⁴'],
    },
    {
      text: 'Given a linked list, detect whether it contains a cycle and return the start of the cycle.',
      title: 'Linked List Cycle Detection',
      skill: 'Linked List',
      estimatedTime: 15,
      difficulty: 'Medium', marks: 15, tags: ['Linked List', 'Two Pointers'],
      functionName: 'detectCycle',
      functionParams: [
        { name: 'head', type: 'LIST NODE', description: 'Head of the linked list' },
      ],
      returnType: 'LIST NODE',
      returnDescription: 'the node where the cycle begins, or null if there is no cycle',
      constraints: ['Number of nodes: 0 ≤ n ≤ 10⁴', '-10⁵ ≤ Node.val ≤ 10⁵'],
    },
    {
      text: 'Implement a function to rotate a matrix (2D array) 90 degrees clockwise in-place.',
      title: 'Rotate Matrix 90°',
      skill: 'Matrix',
      estimatedTime: 25,
      difficulty: 'Hard', marks: 25, tags: ['Matrix', 'Arrays', 'In-place'],
      functionName: 'rotate',
      functionParams: [
        { name: 'n', type: 'INTEGER', description: 'Dimension of the n×n matrix' },
        { name: 'matrix', type: '2D INTEGER ARRAY', description: 'The n×n matrix to rotate' },
      ],
      returnType: 'VOID',
      returnDescription: 'the matrix is modified in-place',
      constraints: ['1 ≤ n ≤ 20', '-1000 ≤ matrix[i][j] ≤ 1000'],
    },
    {
      text: 'Find the number of islands in a given m x n grid where 1 represents land and 0 represents water.',
      title: 'Number of Islands',
      skill: 'Graph Traversal',
      estimatedTime: 25,
      difficulty: 'Hard', marks: 25, tags: ['Graph', 'BFS', 'DFS'],
      functionName: 'numIslands',
      functionParams: [
        { name: 'm', type: 'INTEGER', description: 'Number of rows in the grid' },
        { name: 'n', type: 'INTEGER', description: 'Number of columns in the grid' },
        { name: 'grid', type: '2D CHARACTER ARRAY', description: 'The m×n grid of 0s and 1s' },
      ],
      returnType: 'INTEGER',
      returnDescription: 'the number of islands',
      constraints: ['1 ≤ m, n ≤ 300', 'grid[i][j] is either "0" or "1"'],
    },
  ];

  const sqlQuestions = [
    'Write a SQL query to find the names and salaries of employees who earn more than the average salary in their department. Use a correlated subquery.',
    'Write a SQL query to find the second highest salary from the Employee table without using LIMIT or TOP.',
    'Write a SQL query using a JOIN to list all customers who have placed at least one order, along with their total order amount.',
    'Write a SQL query using a window function to rank employees within each department by their salary in descending order.',
    'Write a SQL query to find departments where the total headcount exceeds 10 and the average salary is above Rs. 80,000.',
    'Write a SQL query to update the status of all orders placed before 2025-01-01 that are still marked as "Pending" to "Closed".',
  ];

  const descriptiveQuestions = [
    'Explain the difference between REST and GraphQL APIs. When would you choose GraphQL over REST for a production application?',
    'Describe the microservices architecture pattern. What are its key benefits and the main challenges teams face when adopting it?',
    'Explain the CAP theorem. How does it influence the design decisions of a distributed database like Cassandra or MongoDB?',
    'What is Dependency Injection? Explain how it promotes loose coupling and testability in a software system with an example.',
    'Describe how garbage collection works in the JVM. What are the differences between the G1GC and ZGC collectors?',
    'Explain containerisation using Docker and orchestration using Kubernetes. How do they improve deployment reliability and scalability?',
  ];

  // Populate 500 questions
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
      qText = baseQ.text;
      qOpts = [...baseQ.opt];
      qCorrect = [...baseQ.ans];
      qTags = ['Quantitative Aptitude', i % 3 === 0 ? 'Time & Work' : i % 3 === 1 ? 'Speed & Distance' : 'Profit & Loss'];
    } else if (i <= 250) {
      // Logical Reasoning
      qTopic = 'Logical Reasoning';
      qType = i % 8 === 0 ? 'Multiple Select' : 'MCQ';
      qDiff = i % 2 === 0 ? 'Medium' : 'Easy';
      qMarks = qType === 'Multiple Select' ? 3 : 2;
      const baseQ = logQuestions[(i - 151) % logQuestions.length];
      qText = baseQ.text;
      qOpts = [...baseQ.opt];
      qCorrect = qType === 'Multiple Select' ? [baseQ.ans[0], (baseQ.ans[0] + 1) % 4] : [...baseQ.ans];
      qTags = ['Reasoning', i % 4 === 0 ? 'Series' : i % 4 === 1 ? 'Blood Relations' : i % 4 === 2 ? 'Direction Sense' : 'Syllogism'];
    } else if (i <= 400) {
      // Technical MCQs
      qTopic = 'Technical';
      qDiff = i % 3 === 0 ? 'Hard' : (i % 3 === 1 ? 'Easy' : 'Medium');
      qMarks = qDiff === 'Easy' ? 2 : (qDiff === 'Medium' ? 3 : 5);
      const baseQ = techQuestions[(i - 251) % techQuestions.length];
      qText = baseQ.text;
      qOpts = [...baseQ.opt];
      qCorrect = [...baseQ.ans];
      const techTagSets = [['DSA', 'Arrays'], ['DSA', 'Trees'], ['DBMS', 'Normalization'], ['OS', 'Process Management'], ['Networking', 'TCP/IP'], ['OOP', 'Design Patterns']];
      qTags = techTagSets[(i - 251) % techTagSets.length];
    } else if (i <= 460) {
      // Coding Challenges
      qType = 'Coding';
      qTopic = 'Coding';
      const baseQ = codingQuestions[(i - 401) % codingQuestions.length];
      qDiff = baseQ.difficulty as Question['difficulty'];
      qMarks = baseQ.marks;
      qText = baseQ.text;
      qTags = [...baseQ.tags];
    } else {
      // SQL & Descriptive
      qTopic = 'Technical';
      qType = i % 2 === 0 ? 'SQL' : 'Descriptive';
      qDiff = i % 3 === 0 ? 'Hard' : 'Medium';
      qMarks = qType === 'SQL' ? 10 : 15;
      if (qType === 'SQL') {
        qText = sqlQuestions[(i - 461) % sqlQuestions.length];
        qTags = ['Database', 'SQL', i % 2 === 0 ? 'Joins' : 'Subquery'];
      } else {
        qText = descriptiveQuestions[(i - 461) % descriptiveQuestions.length];
        qTags = ['Software Engineering', 'System Design'];
      }
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
      ] : undefined,
      ...(qType === 'Coding' ? (() => {
        const cq = codingQuestions[(i - 401) % codingQuestions.length];
        return {
          title: cq.title,
          skill: cq.skill,
          estimatedTime: cq.estimatedTime,
          functionName: cq.functionName,
          functionParams: cq.functionParams,
          returnType: cq.returnType,
          returnDescription: cq.returnDescription,
          constraints: cq.constraints,
        };
      })() : {}),
    });
  }

  // ── Blueprint question bank ──────────────────────────────────────────────────
  const quantsQ = [
    { text: 'A man walks 4 km north, then 3 km east. How far is he from the start?', opt: ['5 km', '7 km', '4 km', '6 km'], ans: [0] },
    { text: 'The ratio of A\'s age to B\'s age is 3:5. If B is 25 years old, what is A\'s age?', opt: ['15 years', '12 years', '18 years', '20 years'], ans: [0] },
    { text: 'A sum of Rs 8000 amounts to Rs 9261 in 3 years at compound interest. Find the rate per annum.', opt: ['5%', '4%', '6%', '3%'], ans: [0] },
    { text: 'If x + y = 10 and xy = 21, find x² + y²?', opt: ['58', '60', '52', '64'], ans: [0] },
    { text: 'A car travels 240 km at 60 km/h and returns at 80 km/h. What is the average speed?', opt: ['68.57 km/h', '70 km/h', '72 km/h', '66 km/h'], ans: [0] },
    { text: 'In how many ways can 5 students be seated in a row?', opt: ['120', '60', '24', '100'], ans: [0] },
    { text: 'Find the simple interest on Rs 5000 at 6% per annum for 2 years.', opt: ['Rs 600', 'Rs 500', 'Rs 700', 'Rs 550'], ans: [0] },
    { text: 'A tap fills a tank in 20 minutes and drains it in 30 minutes. If both are open, how long to fill?', opt: ['60 min', '50 min', '40 min', '45 min'], ans: [0] },
    { text: 'What is the smallest prime number greater than 50?', opt: ['53', '51', '57', '59'], ans: [0] },
    { text: 'If 3x + 7 = 22, what is x?', opt: ['5', '4', '6', '3'], ans: [0] },
  ];

  const logicalQ = [
    { text: 'If CAT = 24, then DOG = ?', opt: ['26', '25', '27', '28'], ans: [0] },
    { text: 'Choose the odd one out: Apple, Mango, Potato, Grapes.', opt: ['Apple', 'Mango', 'Potato', 'Grapes'], ans: [2] },
    { text: 'If DOCTOR is coded as FQEVQT, how is NURSE coded?', opt: ['PWUUG', 'PVUUG', 'PWTTG', 'PVTTG'], ans: [0] },
    { text: 'A is taller than B. B is taller than C. Who is the shortest?', opt: ['A', 'B', 'C', 'Cannot determine'], ans: [2] },
    { text: 'In a row of 10 students, Arun is 4th from left. What is his position from the right?', opt: ['7th', '6th', '8th', '5th'], ans: [0] },
    { text: 'All birds can fly. Penguin is a bird. Therefore?', opt: ['Penguin can fly', 'Penguin cannot fly', 'Some birds cannot fly', 'Cannot conclude'], ans: [0] },
    { text: 'Find the missing number: 4, 9, 16, 25, ?', opt: ['36', '30', '32', '34'], ans: [0] },
    { text: 'Tuesday falls 3 days after Sunday. What day falls 2 days before Friday?', opt: ['Wednesday', 'Thursday', 'Tuesday', 'Monday'], ans: [0] },
    { text: 'If + means ×, × means ÷, ÷ means −, what is 6 + 3 × 2 ÷ 1?', opt: ['8', '10', '9', '7'], ans: [0] },
    { text: 'P is the father of Q. Q is the mother of R. What is P to R?', opt: ['Grandfather', 'Uncle', 'Father', 'Brother'], ans: [0] },
  ];

  const cppQ = [
    { text: 'Which of the following is the correct syntax for a pointer declaration in C++?', opt: ['int *p;', 'int p*;', '*int p;', 'pointer int p;'], ans: [0] },
    { text: 'What is the output of: int x = 5; cout << x++;?', opt: ['5', '6', '4', 'Error'], ans: [0] },
    { text: 'Which storage class in C has the default lifetime for local variables?', opt: ['auto', 'static', 'register', 'extern'], ans: [0] },
    { text: 'What does the "static" keyword do when applied to a local variable in C?', opt: ['Preserves value between calls', 'Makes it global', 'Doubles its size', 'Makes it constant'], ans: [0] },
    { text: 'Which operator is used to access members of a structure through a pointer?', opt: ['->', '.', '::', '*'], ans: [0] },
    { text: 'What is the size of an int on a 32-bit system (in bytes)?', opt: ['4', '2', '8', '1'], ans: [0] },
    { text: 'Which header file is required for using printf and scanf in C?', opt: ['<stdio.h>', '<stdlib.h>', '<string.h>', '<math.h>'], ans: [0] },
    { text: 'What does malloc() return if memory allocation fails?', opt: ['NULL', '0', '-1', 'Error'], ans: [0] },
    { text: 'Which of the following is NOT a valid loop in C?', opt: ['foreach', 'for', 'while', 'do-while'], ans: [0] },
    { text: 'What is the output of: printf("%d", sizeof(char));?', opt: ['1', '2', '4', '8'], ans: [0] },
  ];

  const oopsQ = [
    { text: 'Which OOP principle allows a subclass to provide a specific implementation of a method already defined in the parent class?', opt: ['Overriding', 'Overloading', 'Encapsulation', 'Abstraction'], ans: [0] },
    { text: 'Which of the following best describes Encapsulation?', opt: ['Binding data and methods together', 'Creating multiple objects', 'Inheriting properties', 'Hiding implementation details only'], ans: [0] },
    { text: 'What is the difference between method overloading and method overriding?', opt: ['Overloading: same name, diff params; Overriding: redefine in subclass', 'Overloading: redefine in subclass; Overriding: same name, diff params', 'Both are the same', 'Overloading is compile-time; Overriding is static'], ans: [0] },
    { text: 'Which keyword is used to prevent inheritance in Java?', opt: ['final', 'static', 'private', 'abstract'], ans: [0] },
    { text: 'What is Polymorphism in OOP?', opt: ['Ability to take multiple forms', 'Hiding data', 'Single inheritance', 'Multiple constructors'], ans: [0] },
    { text: 'In C++, which type of inheritance leads to the Diamond Problem?', opt: ['Multiple Inheritance', 'Single Inheritance', 'Multilevel Inheritance', 'Hierarchical Inheritance'], ans: [0] },
    { text: 'Which OOP concept is used to hide the internal state and require all interaction through methods?', opt: ['Encapsulation', 'Polymorphism', 'Abstraction', 'Inheritance'], ans: [0] },
    { text: 'What is a constructor?', opt: ['Special method called when object is created', 'A method to destroy objects', 'A static method only', 'An abstract method'], ans: [0] },
    { text: 'Which of the following is an example of runtime polymorphism?', opt: ['Virtual functions', 'Function overloading', 'Constructor overloading', 'Operator overloading'], ans: [0] },
    { text: 'What does the "abstract" keyword indicate in a class?', opt: ['Class cannot be instantiated', 'Class is private', 'Class has no methods', 'Class is final'], ans: [0] },
  ];

  const sqlMcqQ = [
    { text: 'Which SQL statement is used to retrieve data from a database?', opt: ['SELECT', 'GET', 'FETCH', 'READ'], ans: [0] },
    { text: 'What is the 3rd Normal Form (3NF) in database design concerned with?', opt: ['Removing transitive dependencies', 'Removing partial dependencies', 'Adding primary keys', 'Normalising foreign keys'], ans: [0] },
    { text: 'Which of the following is a necessary condition for a deadlock to occur?', opt: ['Circular wait', 'Mutual exclusion only', 'Preemption', 'Resource release'], ans: [0] },
    { text: 'Which SQL clause is used to filter groups?', opt: ['HAVING', 'WHERE', 'GROUP BY', 'ORDER BY'], ans: [0] },
    { text: 'What does the DISTINCT keyword do in SQL?', opt: ['Removes duplicate rows', 'Sorts data', 'Filters rows', 'Groups data'], ans: [0] },
    { text: 'Which JOIN returns only matching rows from both tables?', opt: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'], ans: [0] },
    { text: 'What is the purpose of a PRIMARY KEY?', opt: ['Uniquely identify each row', 'Link two tables', 'Sort data', 'Create indexes'], ans: [0] },
    { text: 'Which SQL aggregate function counts the number of rows?', opt: ['COUNT()', 'SUM()', 'AVG()', 'MAX()'], ans: [0] },
    { text: 'What does a FOREIGN KEY constraint enforce?', opt: ['Referential integrity', 'Uniqueness', 'Not null', 'Default value'], ans: [0] },
    { text: 'Which SQL command removes all rows from a table without logging individual row deletions?', opt: ['TRUNCATE', 'DELETE', 'DROP', 'REMOVE'], ans: [0] },
  ];

  const htmljsQ = [
    { text: 'Which HTML tag is used to create a hyperlink?', opt: ['<a>', '<link>', '<href>', '<url>'], ans: [0] },
    { text: 'Which CSS property changes the text color?', opt: ['color', 'font-color', 'text-color', 'foreground'], ans: [0] },
    { text: 'What does the "===  " operator do in JavaScript?', opt: ['Strict equality (value + type)', 'Assigns a value', 'Loose equality', 'Compares only type'], ans: [0] },
    { text: 'Which HTML attribute specifies an alternate text for an image?', opt: ['alt', 'title', 'src', 'name'], ans: [0] },
    { text: 'In CSS, which selector targets an element with id="main"?', opt: ['#main', '.main', '*main', 'main'], ans: [0] },
    { text: 'What does DOM stand for in JavaScript?', opt: ['Document Object Model', 'Data Object Method', 'Display Object Module', 'Document Oriented Method'], ans: [0] },
    { text: 'Which JavaScript method adds an element to the end of an array?', opt: ['push()', 'pop()', 'shift()', 'unshift()'], ans: [0] },
    { text: 'What is the correct HTML5 doctype declaration?', opt: ['<!DOCTYPE html>', '<!DOCTYPE HTML5>', '<html doctype>', '<DOCTYPE html>'], ans: [0] },
    { text: 'Which CSS property is used to make an element invisible but still occupy space?', opt: ['visibility: hidden', 'display: none', 'opacity: 0', 'z-index: -1'], ans: [0] },
    { text: 'Which of the following is NOT a JavaScript data type?', opt: ['Float', 'String', 'Boolean', 'Number'], ans: [0] },
  ];

  const subjectiveQ = [
    'Explain the concept of time complexity and space complexity with an example each. Why is it important to consider both?',
    'Describe the SOLID principles of object-oriented design. Give a real-world example for any two of them.',
    'What is the difference between synchronous and asynchronous programming? Give an example of each in any language of your choice.',
    'Explain the concept of recursion. Write a recursive solution to compute the factorial of a number and trace its execution.',
    'What is a RESTful API? Describe the key HTTP methods and when each is used.',
    'Explain how a web browser renders a web page from the moment a URL is typed in the address bar.',
    'What is the difference between a process and a thread? How does multithreading improve application performance?',
    'Describe how TCP/IP works. What is the role of the handshake in establishing a connection?',
  ];

  const sqlQueryQ = [
    'Write a SQL query to find the second highest salary from an Employee table.',
    'Write a SQL query to find all employees who earn more than the average salary in their department.',
    'Write a SQL query using JOIN to list all customers who placed at least one order, along with their total order amount.',
    'Write a SQL query to find departments where the total headcount exceeds 5 and the average salary is above 50,000.',
    'Write a SQL query using a window function to rank employees by salary within each department.',
    'Write a SQL query to find all students who have not submitted any assignment (using NOT EXISTS or LEFT JOIN).',
    'Write a SQL query to update the status of all orders placed before 2024-01-01 that are still "Pending" to "Closed".',
    'Write a SQL query to find duplicate records in a table based on a specific column value.',
  ];

  let nextId = 1501;

  const pushMcq = (topic: Question['topic'], bank: typeof quantsQ, count: number) => {
    for (let j = 0; j < count; j++) {
      const q = bank[j % bank.length];
      const diff: Question['difficulty'] = j % 3 === 0 ? 'Easy' : j % 3 === 1 ? 'Medium' : 'Hard';
      questions.push({
        id: `Q-${nextId++}`,
        text: q.text,
        type: 'MCQ',
        topic,
        difficulty: diff,
        marks: 1,
        tags: [topic],
        options: [...q.opt],
        correctOptions: [...q.ans],
      });
    }
  };

  pushMcq('Quants', quantsQ, 30);
  pushMcq('Logical', logicalQ, 30);
  pushMcq('C/C++', cppQ, 30);
  pushMcq('OOPs', oopsQ, 20);
  pushMcq('SQL', sqlMcqQ, 20);
  pushMcq('HTML/CSS/JS', htmljsQ, 20);

  for (let j = 0; j < 20; j++) {
    questions.push({
      id: `Q-${nextId++}`,
      text: subjectiveQ[j % subjectiveQ.length],
      type: 'Descriptive',
      topic: 'Subjective',
      difficulty: j % 2 === 0 ? 'Medium' : 'Hard',
      marks: 5,
      tags: ['Subjective', 'Theory'],
    });
  }

  for (let j = 0; j < 20; j++) {
    questions.push({
      id: `Q-${nextId++}`,
      text: sqlQueryQ[j % sqlQueryQ.length],
      type: 'SQL',
      topic: 'SQL Query',
      difficulty: j % 3 === 0 ? 'Easy' : j % 3 === 1 ? 'Medium' : 'Hard',
      marks: 10,
      tags: ['SQL', 'Database', 'Query'],
    });
  }

  const deriveLocation = (college: string): string => {
    const c = college.toLowerCase();
    if (c.includes('bangalore'))   return 'Bangalore';
    if (c.includes('hyderabad'))   return 'Hyderabad';
    if (c.includes('pune'))        return 'Pune';
    if (c.includes('mysore'))      return 'Mysore';
    if (c.includes('pondicherry')) return 'Pondicherry';
    if (c.includes('thanjavur'))   return 'Thanjavur';
    if (c.includes('coimbatore') || c.includes('erode') || c.includes('kpr') || c.includes('karpagam')) return 'Coimbatore';
    if (c.includes('madurai'))     return 'Madurai';
    return 'Chennai';
  };

  // 2. Generate Campus Drives from real Presidio history (104 drives, 2020–2026)
  const drives: CampusDrive[] = [];
  for (let i = 0; i < DRIVE_DATA.length; i++) {
    const { college, year } = DRIVE_DATA[i];
    const location = deriveLocation(college);
    const status: CampusDrive['status'] = 'Draft';

    const month = Math.floor(rnd.range(7, 12));
    const date = new Date(year, month, Math.floor(rnd.range(1, 28))).toISOString().split('T')[0];

    const target = Math.floor(rnd.range(10, 50));
    const registered = Math.floor(target * rnd.range(5, 12));
    const selected = Math.floor(registered * rnd.range(0.3, 0.5));

    // Build a deterministic question set per the campus blueprint (22 questions, 75 marks)
    const driveQIds: string[] = [
      // Session 1 – MCQ Round (15 questions, 1 mark each)
      ...[0,1,2].map(k => `Q-${1501 + ((i * 7  + k) % 30)}`),  // Quants (3)
      ...[0,1,2].map(k => `Q-${1531 + ((i * 11 + k) % 30)}`),  // Logical (3)
      ...[0,1,2].map(k => `Q-${1561 + ((i * 13 + k) % 30)}`),  // C/C++ (3)
      ...[0,1  ].map(k => `Q-${1591 + ((i * 9  + k) % 20)}`),  // OOPs (2)
      ...[0,1  ].map(k => `Q-${1611 + ((i * 5  + k) % 20)}`),  // SQL MCQ (2)
      ...[0,1  ].map(k => `Q-${1631 + ((i * 3  + k) % 20)}`),  // HTML/CSS/JS (2)
      // Session 2 – Practical Round (7 questions, 60 marks)
      ...[0,1  ].map(k => `Q-${1651 + ((i * 17 + k) % 20)}`),  // Subjective (2)
      ...[0,1  ].map(k => `Q-${1671 + ((i * 19 + k) % 20)}`),  // SQL Query (2)
      ...[0,1,2].map(k => `Q-${1401 + ((i * 11 + k) % 60)}`),  // Coding/Programming (3)
    ];

    drives.push({
      id: `DRV-${year}-${100 + i}`,
      name: `${college} Campus Recruitment Drive ${year}`,
      college,
      date,
      location,
      targetHiring: target,
      registered,
      selected,
      spocName: `${rnd.pick(FIRST_NAMES)} ${rnd.pick(LAST_NAMES)}`,
      spocContact: `+91 ${Math.floor(rnd.range(7000000000, 9999999999))}`,
      description: DRIVE_DESCRIPTIONS[i % DRIVE_DESCRIPTIONS.length](college),
      status,
      accessMode: i % 3 === 0 ? 'remote' : 'in-person',
      questionIds: driveQIds,
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
    const activeSections = sections.filter(s => s.questionCount > 0);

    assessments.push({
      id: `ASM-${2000 + i}`,
      name,
      type,
      duration,
      totalMarks,
      candidatesAssignedCount: 0,
      status: i <= 80 ? 'Active' : (i <= 90 ? 'Draft' : 'Closed'),
      sections: activeSections,
      questionIds: assignedQIds,
      slug: generateSlug(`${name}-${2000 + i}`),
      accessPassword: `PRES${2000 + i}-${String(Math.floor((i * 7919) % 9000) + 1000)}`,
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
    const genderRoll = rnd.range(0, 100);
    const gender: Candidate['gender'] = genderRoll < 60 ? 'Male' : genderRoll < 98 ? 'Female' : 'Other';

    let funnelStage: Candidate['funnelStage'] = 'Applied';
    let assessmentStatus: Candidate['assessmentStatus'] = 'Not Invited';
    let interviewStatus: Candidate['interviewStatus'] = 'Not Scheduled';
    let offerStatus: Candidate['offerStatus'] = 'None';

    const roll = rnd.range(0, 100);

    const targetAssessment = assessments[i % assessments.length];
    let assessmentScore: number | undefined = undefined;
    let sectionScores: Candidate['sectionScores'] = undefined;
    let durationUsed: number | undefined = undefined;
    let submissionDate: string | undefined = undefined;
    const assessmentPassword = `PRES${Math.floor(rnd.range(1000, 9999))}`;

    if (roll < 40) {
      funnelStage = 'Applied';
      assessmentStatus = 'Not Invited';
    } else if (roll < 60) {
      funnelStage = 'Applied';
      assessmentStatus = 'Pending';
    } else if (roll < 82) {
      funnelStage = 'Online Test';
      if (roll < 72) {
        assessmentStatus = 'Completed';
        assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.3, 0.95));
        durationUsed = Math.floor(targetAssessment.duration * 60 * rnd.range(0.5, 0.95));
        submissionDate = new Date(2026, 4, Math.floor(rnd.range(1, 28))).toISOString();
        const isCombined = targetAssessment.type === 'Combined';
        sectionScores = {
          aptitude: Math.floor(targetAssessment.totalMarks * 0.2 * rnd.range(0.3, 0.9)),
          logical: isCombined ? Math.floor(targetAssessment.totalMarks * 0.1 * rnd.range(0.4, 0.9)) : undefined,
          technical: Math.floor(targetAssessment.totalMarks * 0.5 * rnd.range(0.4, 0.95)),
          coding: rnd.next() > 0.4 ? Math.floor(targetAssessment.totalMarks * 0.3 * rnd.range(0.2, 0.9)) : 0
        };
      } else {
        assessmentStatus = 'InProgress';
      }
    } else if (roll < 92) {
      const stageOptions: Candidate['funnelStage'][] = ['Interview', 'Coding Exercise', 'Whiteboard Interview'];
      funnelStage = rnd.pick(stageOptions);
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.65, 0.98));
      const isCombined = targetAssessment.type === 'Combined';
      sectionScores = {
        aptitude: Math.floor(targetAssessment.totalMarks * 0.25 * rnd.range(0.7, 0.95)),
        logical: isCombined ? Math.floor(targetAssessment.totalMarks * 0.1 * rnd.range(0.6, 0.95)) : undefined,
        technical: Math.floor(targetAssessment.totalMarks * 0.45 * rnd.range(0.75, 0.98)),
        coding: Math.floor(targetAssessment.totalMarks * 0.3 * rnd.range(0.65, 0.95))
      };

      interviewStatus = roll < 87 ? 'Scheduled' : 'Ongoing';

      const hr = Math.floor(rnd.range(9, 17));
      const min = rnd.next() > 0.5 ? '30' : '00';
      interviews.push({
        id: `INT-2026-${1000 + i}`,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        panelName: `Panel ${rnd.pick(['Alpha', 'Beta', 'Gamma', 'Delta'])}`,
        date: new Date(2026, 5, Math.floor(rnd.range(1, 28))).toISOString().split('T')[0],
        time: `${hr}:${min}`,
        stage: funnelStage === 'Interview' ? 'Interview' : (funnelStage === 'Coding Exercise' ? 'Coding Exercise' : 'Whiteboard Interview'),
        status: interviewStatus === 'Scheduled' ? 'Scheduled' : 'Completed',
        feedback: interviewStatus === 'Ongoing' ? rnd.pick(INTERVIEW_FEEDBACK) : undefined,
        rating: interviewStatus === 'Ongoing' ? Math.floor(rnd.range(3, 5)) : undefined
      });

    } else if (roll < 97) {
      funnelStage = 'Offered';
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.75, 0.98));
      interviewStatus = 'Passed';

      const offerRoll = rnd.range(0, 3);
      if (offerRoll < 1) offerStatus = 'Offered';
      else if (offerRoll < 2) offerStatus = 'Accepted';
      else offerStatus = 'Declined';

      offers.push({
        id: `OFF-2026-${200 + i}`,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        college: drive.college,
        ctc: rnd.pick(CTC_STEPS),
        status: offerStatus as Offer['status'],
        dateReleased: new Date(2026, 5, Math.floor(rnd.range(1, 28))).toISOString().split('T')[0]
      });

    } else {
      funnelStage = 'Joined';
      assessmentStatus = 'Completed';
      assessmentScore = Math.floor(targetAssessment.totalMarks * rnd.range(0.8, 0.99));
      interviewStatus = 'Passed';
      offerStatus = 'Joined';

      offers.push({
        id: `OFF-2026-${200 + i}`,
        candidateId: `PRES2026-${10000 + i}`,
        candidateName: name,
        college: drive.college,
        ctc: rnd.pick(JOINED_CTC_STEPS),
        status: 'Joined',
        dateReleased: new Date(2026, Math.floor(rnd.range(3, 5)), Math.floor(rnd.range(1, 28))).toISOString().split('T')[0],
        joiningDate: new Date(2026, 6, 15).toISOString().split('T')[0]
      });
    }

    candidates.push({
      id: `PRES2026-${10000 + i}`,
      name,
      college: drive.college,
      degree,
      gender,
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

  return { drives, candidates, assessments, questions, interviews, offers };
}

const DB_VERSION = '10';

export function getDatabase(): Database {
  if (localStorage.getItem('presidio_talent_hub_db_version') !== DB_VERSION) {
    localStorage.removeItem('presidio_talent_hub_db');
    localStorage.setItem('presidio_talent_hub_db_version', DB_VERSION);
  }
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
  window.dispatchEvent(new CustomEvent('presidio-db-updated', { detail: db }));
}

export function resetDatabase(): Database {
  localStorage.removeItem('presidio_talent_hub_db');
  localStorage.removeItem('presidio_talent_hub_db_version');
  return getDatabase();
}
