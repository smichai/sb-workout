import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { auth, googleProvider, db, signInWithPopup, signOut, onAuthStateChanged } from './firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore';
import {
  Dumbbell,
  Timer,
  Calendar,
  Users,
  User,
  Plus,
  Trash,
  Play,
  Check,
  LogOut,
  Volume2,
  VolumeX,
  Clock,
  ArrowLeft,
  Edit,
  Save,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Lock,
  Sparkles
} from 'lucide-react';

const API_URL = import.meta.env.DEV ? 'http://localhost:5050' : '';

// Predefined database of common exercises
const PRESET_EXERCISES = [
  { name: 'לחיצת חזה עם מוט (Bench Press)', category: 'push', restTime: 90 },
  { name: 'לחיצת חזה עם משקולות (Dumbbell Press)', category: 'push', restTime: 90 },
  { name: 'לחיצת חזה בשיפוע חיובי (Incline Bench Press)', category: 'push', restTime: 90 },
  { name: 'פרפר עם משקולות (Dumbbell Flys)', category: 'push', restTime: 75 },
  { name: 'שכיבות סמיכה (Push-ups)', category: 'push', restTime: 60 },
  
  { name: 'מתח באחיזה רחבה (Pull-ups)', category: 'pull', restTime: 90 },
  { name: 'עליות מתח באחיזה הפוכה (Chin-ups)', category: 'pull', restTime: 75 },
  { name: 'משיכת פולי עליון (Lat Pulldown)', category: 'pull', restTime: 75 },
  { name: 'חתירה עם מוט (Barbell Row)', category: 'pull', restTime: 90 },
  { name: 'חתירה בפולי תחתון (Seated Cable Row)', category: 'pull', restTime: 75 },
  { name: 'חתירה עם משקולת יד (Dumbbell Row)', category: 'pull', restTime: 60 },
  { name: 'דדליפט (Deadlift)', category: 'legs', restTime: 120 },
  
  { name: 'לחיצת כתפיים עם משקולות (Shoulder Press)', category: 'push', restTime: 75 },
  { name: 'הרחקת כתפיים לצדדים (Lateral Raises)', category: 'push', restTime: 60 },
  { name: 'פייס-פולס (Face Pulls)', category: 'pull', restTime: 60 },
  
  { name: 'סקוואט עם מוט (Barbell Squat)', category: 'legs', restTime: 120 },
  { name: 'לחיצת רגליים במכונה (Leg Press)', category: 'legs', restTime: 90 },
  { name: 'פשיטת ברכיים במכונה (Leg Extension)', category: 'legs', restTime: 60 },
  { name: 'כפיפת ברכיים במכונה (Leg Curl)', category: 'legs', restTime: 60 },
  { name: 'מכרעים (Lunges)', category: 'legs', restTime: 75 },
  { name: 'הרמת עקבים לתאומים (Calf Raises)', category: 'legs', restTime: 60 },
  
  { name: 'כפיפת מרפקים עם מוט (Barbell Curl)', category: 'arms', restTime: 60 },
  { name: 'כפיפת מרפקים עם משקולות (Dumbbell Curl)', category: 'arms', restTime: 60 },
  { name: 'כפיפת מרפקים פטישים (Hammer Curl)', category: 'arms', restTime: 60 },
  { name: 'פשיטת מרפקים בפולי (Tricep Pushdown)', category: 'arms', restTime: 60 },
  { name: 'לחיצה צרפתית (French Press)', category: 'arms', restTime: 75 },
  { name: 'מקבילים ליד אחורית (Tricep Dips)', category: 'arms', restTime: 60 },
  
  { name: 'כפיפות בטן (Crunches)', category: 'core', restTime: 45 },
  { name: 'פלאנק / גשר (Plank)', category: 'core', restTime: 60 },
  { name: 'הרמות רגליים בתלייה (Leg Raises)', category: 'core', restTime: 45 }
];

// Interactive Anatomical Athletic Mannequin Simulator Component (Matches User Image Style)
function ExerciseSimulator({ exerciseName }) {
  const getCategory = (name) => {
    const n = (name || '').toLowerCase();
    if (n.includes('חזה') || n.includes('push') || n.includes('שכיבות סמיכה') || n.includes('לחיצת') || n.includes('כתף') || n.includes('shoulder') || n.includes('bench') || n.includes('press') || n.includes('dips') || n.includes('מקבילים')) {
      return 'push';
    }
    if (n.includes('גב') || n.includes('pull') || n.includes('מתח') || n.includes('חתירה') || n.includes('row') || n.includes('chin') || n.includes('פולי')) {
      return 'pull';
    }
    if (n.includes('רגל') || n.includes('leg') || n.includes('סקוואט') || n.includes('squat') || n.includes('לאנז') || n.includes('lunge') || n.includes('תאומים') || n.includes('calves') || n.includes('deadlift') || n.includes('דדליפט')) {
      return 'legs';
    }
    if (n.includes('יד') || n.includes('bicep') || n.includes('tricep') || n.includes('כפיפ') || n.includes('פשיט') || n.includes('curl') || n.includes('pushdown')) {
      return 'arms';
    }
    return 'push';
  };

  const category = getCategory(exerciseName);

  let imageSrc = '/push_muscle.jpg';
  let muscleLabel = 'לחיצה (Push) - חזה וכתפיים';
  if (category === 'pull') {
    imageSrc = '/pull_muscle.jpg';
    muscleLabel = 'משיכה (Pull) - גב ויד קדמית';
  } else if (category === 'legs') {
    imageSrc = '/legs_muscle.jpg';
    muscleLabel = 'רגליים (Squat) - ארבע ראשי וישבן';
  } else if (category === 'arms') {
    imageSrc = '/arms_muscle.jpg';
    muscleLabel = 'זרועות (Arms) - דו-ראשי ותלת-ראשי';
  }

  return (
    <div className="canvas-simulator-panel" style={{ border: '2px solid var(--sport-volt)', background: '#121822', padding: '16px', borderRadius: '16px' }}>
      <div className="canvas-simulator-title" style={{ color: 'var(--sport-volt)', fontWeight: '900', fontSize: '0.95rem', marginBottom: '12px' }}>
        <Dumbbell size={16} />
        <span>הדמיית שרירים אנטומית (סגנון פרימיום)</span>
      </div>
      <div className="canvas-container" style={{ maxWidth: '100%', width: '320px', height: '320px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', background: '#05070a' }}>
        <img 
          src={imageSrc} 
          alt={muscleLabel} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} 
        />
        <span className="simulation-tag" style={{ background: 'rgba(212, 175, 55, 0.15)', color: 'var(--sport-volt)', borderColor: 'var(--sport-volt)', fontSize: '0.75rem', padding: '4px 10px' }}>
          {muscleLabel}
        </span>
      </div>
    </div>
  );
}

const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window.atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT token:', e);
    return null;
  }
};

const toHebrewLetter = (num) => {
  const letters = {
    1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳',
    6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
    11: 'יא׳', 12: 'יב׳', 13: 'יג׳', 14: 'יד׳', 15: 'טו׳',
    16: 'טז׳', 17: 'יז׳', 18: 'יח׳', 19: 'יט׳', 20: 'כ׳',
    21: 'כא׳', 22: 'כב׳', 23: 'כג׳', 24: 'כד׳', 25: 'כה׳',
    26: 'כו׳', 27: 'כז׳', 28: 'כח׳', 29: 'כט׳', 30: 'ל׳'
  };
  return letters[num] || String(num);
};

const calculateSleepDuration = (start, end) => {
  if (!start || !end) return '';
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let diffMin = (eh * 60 + em) - (sh * 60 + sm);
    if (diffMin < 0) {
      diffMin += 24 * 60;
    }
    return (diffMin / 60).toFixed(1);
  } catch (e) {
    return '';
  }
};

const HEBREW_GEMATRIA_DAYS = {
  1: 'א׳', 2: 'ב׳', 3: 'ג׳', 4: 'ד׳', 5: 'ה׳',
  6: 'ו׳', 7: 'ז׳', 8: 'ח׳', 9: 'ט׳', 10: 'י׳',
  11: 'י״א', 12: 'י״ב', 13: 'י״ג', 14: 'י״ד', 15: 'ט״ו',
  16: 'ט״ז', 17: 'י״ז', 18: 'י״ח', 19: 'י״ט', 20: 'כ׳',
  21: 'כ״א', 22: 'כ״ב', 23: 'כ״ג', 24: 'כ״ד', 25: 'כ״ה',
  26: 'כ״ו', 27: 'כ״ז', 28: 'כ״ח', 29: 'כ״ט', 30: 'ל׳'
};

const getHebrewDayNumber = (dateObj) => {
  try {
    const parts = new Intl.DateTimeFormat('en-US-u-ca-hebrew', { day: 'numeric' }).formatToParts(dateObj);
    const dayPart = parts.find(p => p.type === 'day');
    return dayPart ? parseInt(dayPart.value, 10) : 1;
  } catch (e) {
    return 1;
  }
};

const convertHebrewYearToLetters = (yearNum) => {
  const years = {
    5785: 'ה׳תשפ״ה',
    5786: 'ה׳תשפ״ו',
    5787: 'ה׳תשפ״ז',
    5788: 'ה׳תשפ״ח',
    5789: 'ה׳תשפ״ט',
    5790: 'ה׳תש״צ'
  };
  return years[yearNum] || String(yearNum);
};

function App() {
  // Authentication & Navigation
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('sb_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [authError, setAuthError] = useState('');
  const [authUsername, setAuthUsername] = useState('shmouel');
  const [authPassword, setAuthPassword] = useState('123');
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // App Data State
  const [workouts, setWorkouts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [usersStats, setUsersStats] = useState([]);

  // Workout Builder State
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [builderName, setBuilderName] = useState('');
  const [builderType, setBuilderType] = useState('workout'); // 'workout' or 'warmup'
  const [builderExercises, setBuilderExercises] = useState([
    { name: 'לחיצת חזה עם מוט (Bench Press)', sets: 3, reps: '10', weight: 60, restTime: 90 }
  ]);
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [exerciseSearchTerm, setExerciseSearchTerm] = useState('');

  // Active Workout Player State
  const [activeWorkout, setActiveWorkout] = useState(null);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
  const [activeSetIndex, setActiveSetIndex] = useState(0); 
  const [guidedMode, setGuidedMode] = useState(true); // Sequential single set focus
  const [activeSetDuration, setActiveSetDuration] = useState(0);
  const [showFocusDetails, setShowFocusDetails] = useState(false);

  // Rest Timer State
  const [restTimeTotal, setRestTimeTotal] = useState(90);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [restIsActive, setRestIsActive] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Profile Edit State
  const [editNameShmouel, setEditNameShmouel] = useState('');
  const [editNameBeni, setEditNameBeni] = useState('');

  // User Stats & Pre-Workout Metrics State
  const [userStats, setUserStats] = useState([]);
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [preWorkoutWeight, setPreWorkoutWeight] = useState('');
  const [preWorkoutBodyFat, setPreWorkoutBodyFat] = useState('');
  const [preWorkoutSleep, setPreWorkoutSleep] = useState(4);
  const [preWorkoutEnergy, setPreWorkoutEnergy] = useState(4);
  const [preWorkoutTemplate, setPreWorkoutTemplate] = useState(null);
  const [nextWorkoutTemplate, setNextWorkoutTemplate] = useState(null);
  const [preWorkoutWarmupId, setPreWorkoutWarmupId] = useState('');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [calendarEditWeight, setCalendarEditWeight] = useState('');
  const [calendarEditBodyFat, setCalendarEditBodyFat] = useState('');
  const [calendarEditSleep, setCalendarEditSleep] = useState(4);
  const [calendarEditEnergy, setCalendarEditEnergy] = useState(4);
  const [isEditingCalendarMetrics, setIsEditingCalendarMetrics] = useState(false);
  const [preWorkoutSleepStart, setPreWorkoutSleepStart] = useState('23:00');
  const [preWorkoutSleepEnd, setPreWorkoutSleepEnd] = useState('07:00');
  const [calendarEditSleepStart, setCalendarEditSleepStart] = useState('23:00');
  const [calendarEditSleepEnd, setCalendarEditSleepEnd] = useState('07:00');
  const [preWorkoutCustomDate, setPreWorkoutCustomDate] = useState('');
  const [showPreWorkoutCustomDate, setShowPreWorkoutCustomDate] = useState(false);

  // Refs for Timers
  const stopwatchIntervalRef = useRef(null);
  const restTimerIntervalRef = useRef(null);

  const myWorkouts = workouts.filter(w => w.createdBy === user?.username && (w.type === 'workout' || !w.type));
  const myWarmups = workouts.filter(w => w.createdBy === user?.username && w.type === 'warmup');
  const myLogs = logs.filter(log => log.completedBy === user?.username);
  const currentUserStat = usersStats.find(u => u.username === user?.username) || { workoutCount: 0, lastWorkoutDate: null };

  const handleGoogleLogin = async () => {
    setAuthError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      const userData = {
        name: u.displayName || u.email.split('@')[0],
        username: u.email,
        email: u.email,
        picture: u.photoURL
      };
      localStorage.setItem('sb_user', JSON.stringify(userData));
      setUser(userData);
    } catch (err) {
      console.error(err);
      setAuthError('שגיאה בהתחברות עם גוגל');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          username: firebaseUser.email,
          email: firebaseUser.email,
          picture: firebaseUser.photoURL
        };
        localStorage.setItem('sb_user', JSON.stringify(userData));
        setUser(userData);
      } else {
        localStorage.removeItem('sb_user');
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAutoGenerateWorkout = async (type) => {
    setLoading(true);
    let name = '';
    let exercises = [];

    if (type === 'strength') {
      name = 'אימון כוח (Strength) 5x5';
      exercises = [
        { name: 'סקוואט עם מוט (Barbell Squat)', sets: 5, reps: '5', weight: 80, restTime: 120 },
        { name: 'לחיצת חזה עם מוט (Bench Press)', sets: 5, reps: '5', weight: 60, restTime: 120 },
        { name: 'חתירה עם מוט (Barbell Row)', sets: 5, reps: '5', weight: 50, restTime: 120 }
      ];
    } else {
      name = 'אימון נפח והיפרטרופיה (Volume)';
      exercises = [
        { name: 'לחיצת חזה עם משקולות (Dumbbell Press)', sets: 4, reps: '10', weight: 22.5, restTime: 90 },
        { name: 'משיכת פולי עליון (Lat Pulldown)', sets: 4, reps: '10', weight: 50, restTime: 75 },
        { name: 'הרחקת כתפיים לצדדים (Lateral Raises)', sets: 4, reps: '12', weight: 10, restTime: 60 },
        { name: 'כפיפת מרפקים עם משקולות (Dumbbell Curl)', sets: 3, reps: '12', weight: 12.5, restTime: 60 }
      ];
    }

    const payload = {
      name,
      createdBy: user.username,
      exercises
    };

    try {
      await addDoc(collection(db, 'templates'), payload);
      fetchData();
      alert('אימון מומלץ נוצר בהצלחה!');
    } catch (err) {
      console.error('Failed to generate template:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCoachSuggestions = () => {
    const suggestions = [];
    
    if (myWorkouts.length === 0) {
      suggestions.push({
        type: 'start',
        title: 'כתוב תוכנית אימון ראשונה',
        desc: 'כדי לקבל המלצות ושדרוגים מבוססי היסטוריה, הוסף את התרגילים שלך בלשונית "כתיבת אימון".'
      });
      return suggestions;
    }

    if (myLogs.length > 0) {
      const lastLog = myLogs[0];
      const successfulExercises = lastLog.exercises.filter(ex => 
        ex.sets.length > 0 && ex.sets.every(s => s.completed && s.reps >= 8)
      );

      if (successfulExercises.length > 0) {
        const targetEx = successfulExercises[0];
        const lastSet = targetEx.sets[targetEx.sets.length - 1];
        const newWeight = lastSet.weight + 2.5;
        suggestions.push({
          type: 'overload',
          title: `שדרוג משקל: ${targetEx.name}`,
          desc: `ביצעת בהצלחה את כל הסטים של תרגיל זה עם ${lastSet.weight} ק״ג. באימון הבא, נסה להעלות את משקל העבודה ל-${newWeight} ק״ג לגירוי מוגבר!`
        });
      }
    }

    suggestions.push({
      type: 'rest',
      title: 'טיפ מנוחה: התאוששות כוח',
      desc: 'בתרגילים מורכבים (כמו סקוואט או לחיצת חזה) מנוחה של 90-120 שניות תעזור לגיוס כוח מרבי. בתרגילים קטנים (כמו כפיפת ידיים) מנוחה של 60 שניות מספיקה.'
    });

    return suggestions;
  };

  // Fetch database records
  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const workoutsSnap = await getDocs(collection(db, 'templates'));
      const workoutsData = workoutsSnap.docs.map(docVal => ({ id: docVal.id, ...docVal.data() }));
      setWorkouts(workoutsData);

      const logsSnap = await getDocs(collection(db, 'logs'));
      const logsData = logsSnap.docs.map(docVal => ({ id: docVal.id, ...docVal.data() }));
      setLogs(logsData.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt)));

      const statsSnap = await getDocs(collection(db, 'userStats'));
      const statsData = statsSnap.docs.map(docVal => ({ id: docVal.id, ...docVal.data() }));
      setUserStats(statsData.sort((a, b) => new Date(a.date) - new Date(b.date)));

      setUsersStats([
        { username: 'shmouel', name: 'שמואל' },
        { username: 'beni', name: 'בני' }
      ]);
    } catch (error) {
      console.error('Error fetching data from Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Auth Functions
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('התחברות זו מושבתת. נא להשתמש בכפתור ההתחברות עם Google.');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
    localStorage.removeItem('sb_user');
    setUser(null);
    setActiveWorkout(null);
    setCurrentTab('dashboard');
  };

  // Profile Edit Submission
  const handleUpdateProfileName = async (username, name) => {
    try {
      await setDoc(doc(db, 'users', username), { name, username });
      if (user.username === username) {
        const newUser = { ...user, name };
        localStorage.setItem('sb_user', JSON.stringify(newUser));
        setUser(newUser);
      }
      fetchData();
      alert('הפרופיל עודכן בהצלחה!');
    } catch (err) {
      console.error('Failed to update profile name:', err);
    }
  };

  // Workout Template Functions
  const handleSaveWorkoutTemplate = async (e) => {
    e.preventDefault();
    if (!builderName.trim()) {
      alert('נא להזין שם לאימון');
      return;
    }

    const payload = {
      name: builderName,
      type: builderType,
      createdBy: user.username,
      exercises: builderExercises
    };

    try {
      if (editingTemplate) {
        await setDoc(doc(db, 'templates', editingTemplate.id), payload);
      } else {
        await addDoc(collection(db, 'templates'), payload);
      }
      fetchData();
      setEditingTemplate(null);
      setBuilderName('');
      setBuilderType('workout');
      setBuilderExercises([{ name: 'לחיצת חזה עם מוט (Bench Press)', sets: 3, reps: '10', weight: 60, restTime: 90 }]);
      setCurrentTab('dashboard');
    } catch (err) {
      console.error('Error saving workout:', err);
    }
  };

  const handleDeleteWorkoutTemplate = async (id, name) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את האימון "${name}"?`)) return;
    try {
      await deleteDoc(doc(db, 'templates', id));
      fetchData();
    } catch (err) {
      console.error('Error deleting workout:', err);
    }
  };

  const startEditWorkoutTemplate = (template) => {
    setEditingTemplate(template);
    setBuilderName(template.name);
    setBuilderType(template.type || 'workout');
    
    const loadedEx = template.exercises.map(ex => {
      let sd = ex.setsDetail;
      if (!sd || sd.length === 0) {
        const count = parseInt(ex.sets) || 3;
        sd = [];
        for (let i = 0; i < count; i++) {
          sd.push({
            setNumber: i + 1,
            type: 'regular',
            reps: ex.reps || '10',
            weight: ex.weight || 60
          });
        }
      }
      return { 
        ...ex, 
        type: ex.type || 'workout',
        isSuperset: !!ex.isSuperset,
        subExercises: ex.subExercises || [],
        setsDetail: sd 
      };
    });
    
    setBuilderExercises(loadedEx);
    setCurrentTab('builder');
  };

  // Builder exercise row management
  const addBuilderExercise = () => {
    setBuilderExercises([
      ...builderExercises,
      { 
        name: '', 
        type: 'workout',
        isSuperset: false,
        subExercises: [],
        sets: 3, 
        reps: '10', 
        weight: 0, 
        restTime: 60,
        setsDetail: [
          { setNumber: 1, type: 'regular', reps: '10', weight: 0 },
          { setNumber: 2, type: 'regular', reps: '10', weight: 0 },
          { setNumber: 3, type: 'regular', reps: '10', weight: 0 }
        ]
      }
    ]);
  };

  const removeBuilderExercise = (index) => {
    const next = [...builderExercises];
    next.splice(index, 1);
    setBuilderExercises(next);
  };

  const updateBuilderExerciseField = (index, field, val) => {
    const next = [...builderExercises];
    next[index][field] = val;

    if (field === 'sets') {
      const count = parseInt(val) || 1;
      let currentSetsDetail = [...(next[index].setsDetail || [])];
      
      if (currentSetsDetail.length < count) {
        for (let i = currentSetsDetail.length; i < count; i++) {
          currentSetsDetail.push({
            setNumber: i + 1,
            type: 'regular',
            reps: next[index].reps || '10',
            weight: next[index].weight || 0
          });
        }
      } else if (currentSetsDetail.length > count) {
        currentSetsDetail = currentSetsDetail.slice(0, count);
      }
      next[index].setsDetail = currentSetsDetail;
    }

    if (field === 'reps' || field === 'weight') {
      let currentSetsDetail = [...(next[index].setsDetail || [])];
      if (currentSetsDetail.length === 0) {
        const count = parseInt(next[index].sets) || 3;
        for (let i = 0; i < count; i++) {
          currentSetsDetail.push({
            setNumber: i + 1,
            type: 'regular',
            reps: next[index].reps || '10',
            weight: next[index].weight || 0
          });
        }
      }
      currentSetsDetail = currentSetsDetail.map((sd) => {
        if (field === 'reps') return { ...sd, reps: val };
        if (field === 'weight') return { ...sd, weight: val };
        return sd;
      });
      next[index].setsDetail = currentSetsDetail;
    }

    setBuilderExercises(next);
  };

  const updateBuilderSetDetailField = (exerciseIndex, setIndex, field, val) => {
    const next = [...builderExercises];
    const ex = next[exerciseIndex];
    let currentSetsDetail = [...(ex.setsDetail || [])];
    
    if (currentSetsDetail.length === 0) {
      const count = parseInt(ex.sets) || 3;
      for (let i = 0; i < count; i++) {
        currentSetsDetail.push({
          setNumber: i + 1,
          type: 'regular',
          reps: ex.reps || '10',
          weight: ex.weight || 0
        });
      }
    }

    currentSetsDetail[setIndex] = {
      ...currentSetsDetail[setIndex],
      [field]: val
    };
    ex.setsDetail = currentSetsDetail;

    if (setIndex === 0) {
      if (field === 'reps') ex.reps = val;
      if (field === 'weight') ex.weight = val;
    }

    setBuilderExercises(next);
  };

  // Select predefined exercise in builder
  const selectPresetExercise = (index, preset) => {
    const next = [...builderExercises];
    next[index].name = preset.name;
    next[index].restTime = preset.restTime;
    setBuilderExercises(next);
    setActiveDropdownIndex(null);
  };

  // ACTIVE WORKOUT PLAYER LOGIC
  const startWorkoutSession = (template) => {
    // Sort exercises so that warmup exercises always come first
    const sortedTemplateExercises = [...(template.exercises || [])].sort((a, b) => {
      const aWarm = a.type === 'warmup' ? 1 : 0;
      const bWarm = b.type === 'warmup' ? 1 : 0;
      return bWarm - aWarm;
    });

    const sessionExercises = sortedTemplateExercises.map(ex => {
      let sets = [];
      if (ex.setsDetail && ex.setsDetail.length > 0) {
        sets = ex.setsDetail.map(sd => {
          const setObj = {
            setNumber: sd.setNumber,
            reps: sd.reps,
            weight: sd.weight,
            completed: false,
            type: sd.type || 'regular'
          };
          if (ex.isSuperset) {
            setObj.subResults = (ex.subExercises || []).map(sub => ({
              name: sub.name,
              reps: sub.reps || sd.reps || '10',
              weight: sub.weight !== undefined ? sub.weight : sd.weight || 0
            }));
          }
          return setObj;
        });
      } else {
        const setsCount = parseInt(ex.sets) || 3;
        for (let i = 0; i < setsCount; i++) {
          const setObj = {
            setNumber: i + 1,
            reps: ex.reps,
            weight: ex.weight,
            completed: false,
            type: 'regular'
          };
          if (ex.isSuperset) {
            setObj.subResults = (ex.subExercises || []).map(sub => ({
              name: sub.name,
              reps: sub.reps || ex.reps || '10',
              weight: sub.weight !== undefined ? sub.weight : ex.weight || 0
            }));
          }
          sets.push(setObj);
        }
      }
      return {
        name: ex.name,
        type: ex.type || 'workout',
        isSuperset: !!ex.isSuperset,
        subExercises: ex.subExercises || [],
        restTime: ex.restTime || 60,
        sets
      };
    });

    const newSession = {
      templateId: template.id,
      name: template.name,
      duration: 0,
      exercises: sessionExercises
    };

    setActiveWorkout(newSession);
    setActiveExerciseIndex(0);
    setActiveSetIndex(0);
    setRestTimeLeft(0);
    setRestIsActive(false);
    setActiveSetDuration(0);
    setShowFocusDetails(false);

    // Start global stopwatch
    if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    stopwatchIntervalRef.current = setInterval(() => {
      setActiveWorkout(prev => {
        if (!prev) return null;
        return {
          ...prev,
          duration: prev.duration + 1
        };
      });
      // Increment current active set stopwatch duration if not in a rest break
      setRestTimeLeft(restVal => {
        if (restVal <= 0) {
          setActiveSetDuration(d => d + 1);
        }
        return restVal;
      });
    }, 1000);
  };

  const getHebrewDateString = () => {
    try {
      return new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { dateStyle: 'long' }).format(new Date());
    } catch (e) {
      return '';
    }
  };

  const getHebrewCalendarDay = (dateObj) => {
    const dayNum = getHebrewDayNumber(dateObj);
    const gematria = HEBREW_GEMATRIA_DAYS[dayNum] || String(dayNum);
    
    // On Rosh Chodesh (day 1), append the Hebrew month name (e.g. א׳ אב)
    if (dayNum === 1) {
      try {
        const monthName = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(dateObj);
        return `${gematria} ${monthName}`;
      } catch (e) {
        return gematria;
      }
    }
    return gematria;
  };

  const getHebrewFullDate = (dateObj) => {
    try {
      let full = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { dateStyle: 'long' }).format(dateObj);
      const dayNum = getHebrewDayNumber(dateObj);
      const gematria = HEBREW_GEMATRIA_DAYS[dayNum] || String(dayNum);
      full = full.replace(/^\d+/, gematria);
      full = full.replace(/^אחד\b/, 'א׳');
      return full;
    } catch (e) {
      return '';
    }
  };

  const getHebrewMonthSpan = (date) => {
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const firstHebMonth = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long' }).format(firstDay);
      const lastHebMonth = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { month: 'long', year: 'numeric' }).format(lastDay);
      
      let result = '';
      if (firstHebMonth === lastHebMonth.split(' ')[0]) {
        result = lastHebMonth;
      } else {
        result = `${firstHebMonth} - ${lastHebMonth}`;
      }
      
      // Replace any 4-digit Hebrew year (5780-5799) with Hebrew letters representation
      result = result.replace(/\b(57\d{2})\b/g, (match) => {
        return convertHebrewYearToLetters(parseInt(match, 10));
      });
      
      return result;
    } catch (e) {
      return '';
    }
  };

  const handlePreWorkoutSubmit = async (e) => {
    e.preventDefault();
    if (!preWorkoutWeight) {
      alert('אנא הזן משקל גוף');
      return;
    }

    const dateObj = showPreWorkoutCustomDate && preWorkoutCustomDate 
      ? new Date(preWorkoutCustomDate) 
      : new Date();
    const hebrewDate = getHebrewFullDate(dateObj);
    
    const payload = {
      username: user.username,
      weight: parseFloat(preWorkoutWeight),
      bodyFat: preWorkoutBodyFat ? parseFloat(preWorkoutBodyFat) : null,
      sleepQuality: parseInt(preWorkoutSleep),
      energyLevel: parseInt(preWorkoutEnergy),
      hebrewDate,
      sleepStart: preWorkoutSleepStart,
      sleepEnd: preWorkoutSleepEnd,
      date: dateObj.toISOString()
    };

    const getLocalDateString = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setLoading(true);
    try {
      const dateString = getLocalDateString(dateObj);
      const docId = `${user.username}_${dateString}`;
      await setDoc(doc(db, 'userStats', docId), payload);

      fetchData();
      
      if (preWorkoutWarmupId) {
        const warmupTpl = workouts.find(w => w.id === preWorkoutWarmupId);
        if (warmupTpl) {
          setNextWorkoutTemplate(preWorkoutTemplate);
          startWorkoutSession(warmupTpl);
        } else {
          startWorkoutSession(preWorkoutTemplate);
        }
      } else {
        startWorkoutSession(preWorkoutTemplate);
      }

      setShowPreWorkoutModal(false);
      setPreWorkoutTemplate(null);
      setPreWorkoutWarmupId('');
    } catch (err) {
      console.error('Error saving stats:', err);
      if (preWorkoutWarmupId) {
        const warmupTpl = workouts.find(w => w.id === preWorkoutWarmupId);
        if (warmupTpl) {
          setNextWorkoutTemplate(preWorkoutTemplate);
          startWorkoutSession(warmupTpl);
        } else {
          startWorkoutSession(preWorkoutTemplate);
        }
      } else {
        startWorkoutSession(preWorkoutTemplate);
      }
      setShowPreWorkoutModal(false);
      setPreWorkoutWarmupId('');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCalendarDayMetrics = async (e) => {
    e.preventDefault();
    if (!calendarEditWeight) {
      alert('אנא הזן משקל גוף');
      return;
    }

    const dateObj = new Date(selectedCalendarDay);
    const hebrewDate = getHebrewFullDate(dateObj);

    const payload = {
      username: user.username,
      weight: parseFloat(calendarEditWeight),
      bodyFat: calendarEditBodyFat ? parseFloat(calendarEditBodyFat) : null,
      sleepQuality: parseInt(calendarEditSleep),
      energyLevel: parseInt(calendarEditEnergy),
      hebrewDate,
      sleepStart: calendarEditSleepStart,
      sleepEnd: calendarEditSleepEnd,
      date: dateObj.toISOString()
    };

    const getLocalDateString = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setLoading(true);
    try {
      const dateString = getLocalDateString(dateObj);
      const docId = `${user.username}_${dateString}`;
      await setDoc(doc(db, 'userStats', docId), payload);

      fetchData();
      setIsEditingCalendarMetrics(false);
    } catch (err) {
      console.error('Error saving stats to Firestore:', err);
      alert('שגיאה בשמירת נתוני גוף');
    } finally {
      setLoading(false);
    }
  };

  const updateActiveSetResult = (exIndex, setIndex, field, val) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      next.exercises[exIndex].sets[setIndex][field] = val;
      return next;
    });
  };

  const updateActiveSetSubResult = (exIndex, setIndex, subIndex, field, val) => {
    setActiveWorkout(prev => {
      if (!prev) return prev;
      const next = { ...prev };
      const setObj = next.exercises[exIndex].sets[setIndex];
      if (setObj.subResults && setObj.subResults[subIndex]) {
        setObj.subResults[subIndex][field] = val;
      }
      return next;
    });
  };

  const toggleSetCompletion = (exIndex, setIndex) => {
    if (!activeWorkout) return;
    
    const nextWorkout = { ...activeWorkout };
    const setObj = nextWorkout.exercises[exIndex].sets[setIndex];
    const isNowCompleted = !setObj.completed;
    
    setObj.completed = isNowCompleted;
    setActiveWorkout(nextWorkout);

    // If set is completed, trigger the rest countdown timer automatically
    if (isNowCompleted) {
      const restSec = nextWorkout.exercises[exIndex].restTime || 60;
      startRestCountdown(restSec);
      setActiveSetDuration(0); // Reset set timer
      
      // If we are in Guided Sequential Mode, automatically advance focus
      if (guidedMode) {
        setTimeout(() => {
          advanceGuidedFocus(exIndex, setIndex);
        }, 300); 
      }
    }
  };

  // Advances focus to the next set or exercise in Guided mode
  const advanceGuidedFocus = (exIndex, setIndex) => {
    const ex = activeWorkout.exercises[exIndex];
    setActiveSetDuration(0); // Reset set timer
    if (setIndex < ex.sets.length - 1) {
      setActiveSetIndex(setIndex + 1);
    } else {
      if (exIndex < activeWorkout.exercises.length - 1) {
        setActiveExerciseIndex(exIndex + 1);
        setActiveSetIndex(0);
      } else {
        console.log("All sets finished!");
      }
    }
  };

  const updateSetInput = (exIndex, setIndex, field, value) => {
    if (!activeWorkout) return;
    const nextWorkout = { ...activeWorkout };
    nextWorkout.exercises[exIndex].sets[setIndex][field] = value;
    setActiveWorkout(nextWorkout);
  };

  // Quick plus/minus adjustments for sets (weight & reps)
  const adjustSetValues = (exIndex, setIndex, field, delta) => {
    if (!activeWorkout) return;
    const set = activeWorkout.exercises[exIndex].sets[setIndex];
    if (field === 'weight') {
      const currentVal = parseFloat(set.weight) || 0;
      const newVal = Math.max(0, currentVal + delta);
      updateSetInput(exIndex, setIndex, 'weight', newVal % 1 === 0 ? newVal.toString() : newVal.toFixed(1));
    } else if (field === 'reps') {
      const currentVal = parseInt(set.reps) || 0;
      const newVal = Math.max(0, currentVal + delta);
      updateSetInput(exIndex, setIndex, 'reps', newVal.toString());
    }
  };

  // REST TIMER COUNTDOWN LOGIC
  const startRestCountdown = (seconds) => {
    if (restTimerIntervalRef.current) clearInterval(restTimerIntervalRef.current);
    setRestTimeTotal(seconds);
    setRestTimeLeft(seconds);
    setRestIsActive(true);

    restTimerIntervalRef.current = setInterval(() => {
      setRestTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(restTimerIntervalRef.current);
          setRestIsActive(false);
          playAlarmSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleRestTimer = () => {
    if (restIsActive) {
      clearInterval(restTimerIntervalRef.current);
      setRestIsActive(false);
    } else {
      if (restTimeLeft <= 0) {
        startRestCountdown(restTimeTotal);
      } else {
        setRestIsActive(true);
        restTimerIntervalRef.current = setInterval(() => {
          setRestTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(restTimerIntervalRef.current);
              setRestIsActive(false);
              playAlarmSound();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  };

  const resetRestTimer = () => {
    clearInterval(restTimerIntervalRef.current);
    setRestIsActive(false);
    setRestTimeLeft(restTimeTotal);
  };

  const adjustRestTime = (secondsToAdd) => {
    setRestTimeLeft(prev => {
      const newVal = Math.max(0, prev + secondsToAdd);
      if (newVal > restTimeTotal) {
        setRestTimeTotal(newVal);
      }
      return newVal;
    });
  };

  // Web Audio Synth alarm beep
  const playAlarmSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (time, frequency, duration) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.3, time + 0.05);
        gain.gain.setValueAtTime(0.3, time + duration - 0.05);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = audioCtx.currentTime;
      playBeep(now, 880, 0.18);
      playBeep(now + 0.22, 880, 0.18);
      playBeep(now + 0.5, 880, 0.18);
      playBeep(now + 0.72, 880, 0.18);
      
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    } catch (e) {
      console.error('Failed to trigger audio synth:', e);
    }
  };

  const getRestTip = () => {
    const tips = [
      "💦 הצעה: קח שלוק מים קטן כעת כדי לשמור על הידרציה ולחות השרירים!",
      "🫁 נשימה: קח שתי שאיפות מהירות מהאף ונשיפה אחת ארוכה מהפה להורדת דופק.",
      "🧘 מנח מנוחה: הישען מעט לפנים והנח ידיים על הברכיים להתאוששות נשימה מהירה.",
      "💧 טיפ מים: מים קרים מסייעים להורדת חום הגוף ומאיצים את התאוששות סיבי השריר.",
      "⏱️ מנוחה: הקפד לא להאריך את המנוחה מעבר למטרה כדי לשמור על מתח שריר מיטבי."
    ];
    const index = Math.floor(restTimeLeft / 12) % tips.length;
    return tips[index] || tips[0];
  };

  // Finish session & sync to DB
  const handleFinishWorkout = async () => {
    if (!activeWorkout) return;
    if (!confirm('האם ברצונך לסיים את האימון ולשמור אותו ביומן?')) return;

    clearInterval(stopwatchIntervalRef.current);
    clearInterval(restTimerIntervalRef.current);

    const payload = {
      workoutId: activeWorkout.templateId || 'custom',
      name: activeWorkout.name,
      completedBy: user.username,
      duration: activeWorkout.duration,
      completedAt: new Date().toISOString(),
      exercises: activeWorkout.exercises.map(ex => ({
        name: ex.name,
        isSuperset: !!ex.isSuperset,
        subExercises: ex.subExercises || [],
        sets: ex.sets.map(s => ({
          setNumber: s.setNumber,
          reps: parseInt(s.reps) || 0,
          weight: parseFloat(s.weight) || 0,
          completed: s.completed,
          type: s.type || 'regular',
          subResults: (s.subResults || []).map(sr => ({
            name: sr.name,
            reps: parseInt(sr.reps) || 0,
            weight: parseFloat(sr.weight) || 0
          }))
        }))
      }))
    };

    try {
      await addDoc(collection(db, 'logs'), payload);
      fetchData();
      setActiveWorkout(null);
      
      const queuedTemplate = nextWorkoutTemplate;
      setNextWorkoutTemplate(null);
      if (queuedTemplate) {
        setPreWorkoutTemplate(queuedTemplate);
        setPreWorkoutWarmupId('');
        setPreWorkoutWeight('');
        setPreWorkoutBodyFat('');
        setShowPreWorkoutModal(true);
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('history');
      }
    } catch (err) {
      console.error('Error logging workout to Firestore:', err);
      alert('שגיאה בשמירת יומן האימון בענן.');
      setActiveWorkout(null);
      
      const queuedTemplate = nextWorkoutTemplate;
      setNextWorkoutTemplate(null);
      if (queuedTemplate) {
        setPreWorkoutTemplate(queuedTemplate);
        setPreWorkoutWarmupId('');
        setPreWorkoutWeight('');
        setPreWorkoutBodyFat('');
        setShowPreWorkoutModal(true);
        setCurrentTab('dashboard');
      } else {
        setCurrentTab('history');
      }
    }
  };

  const handleCancelWorkout = () => {
    if (!confirm('האם אתה בטוח שברצונך לבטל את האימון הנוכחי? ההתקדמות לא תישמר.')) return;
    clearInterval(stopwatchIntervalRef.current);
    clearInterval(restTimerIntervalRef.current);
    setActiveWorkout(null);
    setCurrentTab('dashboard');
  };

  // History Log Functions
  const handleDeleteLog = async (id, name) => {
    if (!confirm(`האם למחוק אימון מתועד זה מיומן האימונים?`)) return;
    try {
      await deleteDoc(doc(db, 'logs', id));
      fetchData();
    } catch (err) {
      console.error('Error deleting log from Firestore:', err);
    }
  };

  // Helper formatting functions
  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'ללא';
    const date = new Date(isoString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Dual Jewish Hebrew Calendar formatting using Unicode DateTimeFormat
  const formatHebrewDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const formatter = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      let full = formatter.format(date);
      const dayNum = getHebrewDayNumber(date);
      const gematria = HEBREW_GEMATRIA_DAYS[dayNum] || String(dayNum);
      full = full.replace(/^\d+/, gematria);
      full = full.replace(/^אחד\b/, 'א׳');
      return full;
    } catch (e) {
      return '';
    }
  };

  // Click outside dropdown handler
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownIndex(null);
    };
    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
      if (restTimerIntervalRef.current) clearInterval(restTimerIntervalRef.current);
    };
  }, []);

  // --- RENDERING SUBSCREENS ---

  // Auth Screen (Login)
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card glass-panel">
          <div className="auth-logo">
            <img src="/logo.jpg" alt="SB Sports Logo" className="logo-img" />
          </div>
          <h1 className="auth-title text-gold-gradient">SB SPORTS</h1>
          <p className="auth-subtitle" style={{ marginBottom: 24 }}>התחברות מאובטחת לחשבון האישי שלך</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%' }}>
              <div id="googleBtnParent" style={{ width: '100%', display: 'none', justifyContent: 'center' }}></div>
              
              <button 
                type="button" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  width: '280px',
                  height: '44px',
                  background: '#ffffff',
                  border: 'none',
                  borderRadius: '22px',
                  color: '#1f1f1f',
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
                onClick={() => {
                  handleGoogleLogin("shmouel@gmail.com", "שמואל", "https://lh3.googleusercontent.com/a/default-user");
                }}
              >
                <svg width="20" height="20" viewBox="0 0 18 18" style={{ minWidth: '20px' }}>
                  <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.8 2.71v2.24h2.91c1.7-1.56 2.69-3.86 2.69-6.58z" />
                  <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.24c-.8.54-1.84.87-3.05.87-2.34 0-4.33-1.58-5.03-3.7H.95v2.3C2.43 15.89 5.5 18 9 18z" />
                  <path fill="#FBBC05" d="M3.97 10.75c-.18-.54-.28-1.1-.28-1.75s.1-1.21.28-1.75V4.95H.95A8.96 8.96 0 0 0 0 9c0 1.45.35 2.82.95 4.05l3.02-2.3z" />
                  <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.8 11.43 0 9 0 5.5 0 2.43 2.11.95 5.09l3.02 2.3c.7-2.12 2.69-3.81 5.03-3.81z" />
                </svg>
                <span>התחבר באמצעות Google</span>
              </button>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 12, lineHeight: '140%', textAlign: 'center' }}>
              לחץ על כפתור ההתחברות כדי להיכנס באופן מיידי לחשבון האישי שלך.
            </p>
          </div>

          {authError && <p style={{ color: 'var(--sport-orange)', marginTop: 16, fontSize: '0.9rem' }}>{authError}</p>}
        </div>
      </div>
    );
  }

  // Active Workout Mode (Guided Sequential Focus or Classic Grid)
  if (activeWorkout) {
    const currentEx = activeWorkout.exercises[activeExerciseIndex];
    
    // Statistics for progress bars
    const totalSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);
    const completionPercentage = totalSets > 0 ? (completedSets / totalSets) * 100 : 0;
    const isAllWorkoutCompleted = completedSets === totalSets;

    // Rest Timer SVG params
    const svgRadius = 100;
    const svgCircumference = 2 * Math.PI * svgRadius;
    const isResting = restTimeLeft > 0;
    
    const strokeDashoffset = isResting 
      ? svgCircumference - (restTimeLeft / restTimeTotal) * svgCircumference
      : 0; // Full circle when active

    return (
      <div className="app-container" style={{ paddingTop: 20 }}>
        {/* BIG WORKOUT TYPE HEADER */}
        <div className="active-workout-header-block" style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--sport-volt)', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>אימון פעיל</span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', margin: 0, lineHeight: '120%' }}>{activeWorkout.name}</h1>
        </div>

        {/* Sleek Horizontal Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>זמן אימון כולל</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '1.15rem', fontWeight: '800', fontFamily: 'var(--font-latin)', color: 'var(--sport-volt)' }}>
              <Clock size={14} />
              {formatTime(activeWorkout.duration)}
            </div>
          </div>
          <div style={{ textAlign: 'center', borderRight: '1px solid var(--border-color)' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2 }}>התקדמות סטים</span>
            <span style={{ fontSize: '1.15rem', fontWeight: '800' }}>{completedSets} / {totalSets} ({Math.round(completionPercentage)}%)</span>
          </div>
        </div>

        {/* MAIN WORKOUT FOCUS PLAYER */}
        <div className="fullscreen-focus-layout">
          {isAllWorkoutCompleted ? (
            <div className="focus-set-details" style={{ borderColor: 'var(--sport-volt)', background: 'rgba(212,175,55,0.02)', width: '100%' }}>
              <Check size={48} style={{ color: 'var(--sport-volt)', marginBottom: 16 }} />
              <h2 className="focus-exercise-title">האימון הושלם!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>כל {totalSets} הסטים בוצעו בהצלחה.</p>
              
              <button 
                className="guided-btn-done" 
                onClick={handleFinishWorkout}
                style={{ width: '100%', margin: '0 auto' }}
              >
                שמור וסיים אימון
              </button>
            </div>
          ) : (
            <>
              {/* Sleek focus container (No giant circle) */}
              <div className="focus-set-details" style={{ width: '100%', padding: '24px 20px', borderRadius: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 12 }}>
                  <span className="exercise-index-badge" style={{ fontSize: '0.8rem', color: 'var(--sport-volt)', fontWeight: 'bold', background: 'rgba(255,255,255,0.03)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>תרגיל {activeExerciseIndex + 1} מתוך {activeWorkout.exercises.length}</span>
                </div>

                <h2 className="focus-exercise-title" style={{ fontSize: '1.6rem', fontWeight: '800', marginBottom: 20, color: '#fff', textAlign: 'center' }}>{currentEx.name}</h2>

                {/* DYNAMIC MINIMALIST TIMER DISPLAY */}
                {isResting ? (
                  /* Rest Mode Minimal Display */
                  <div style={{ background: 'rgba(255, 90, 95, 0.04)', border: '1px solid rgba(255, 90, 95, 0.15)', borderRadius: '16px', padding: '20px 16px', textAlign: 'center', marginBottom: 20 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--sport-orange)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', display: 'block', marginBottom: 4 }}>זמן מנוחה פעיל</span>
                    <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--sport-orange)', fontFamily: 'var(--font-latin)', lineHeight: '100%' }}>
                      {restTimeLeft} <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>ש'</span>
                    </div>
                  </div>
                ) : (
                  /* Training Mode Minimal Stopwatch Display */
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '20px', marginBottom: 20 }}>
                    <span style={{ fontSize: '2.2rem', fontWeight: '900', color: 'var(--sport-volt)', fontFamily: 'var(--font-latin)' }}>{formatTime(activeSetDuration)}</span>
                  </div>
                )}

                {/* Rest Timer quick adjustments (only visible when resting) */}
                {isResting && (
                  <div className="rest-quick-btns" style={{ margin: '0 auto 12px', maxWidth: '320px' }}>
                    <button type="button" className="rest-quick-btn" onClick={() => adjustRestTime(15)}>+15 ש'</button>
                    <button type="button" className="rest-quick-btn" onClick={() => adjustRestTime(-15)}>-15 ש'</button>
                    <button type="button" className="rest-quick-btn" onClick={() => adjustRestTime(30)}>+30 ש'</button>
                    <button type="button" className="rest-quick-btn" onClick={() => adjustRestTime(-30)}>-30 ש'</button>
                  </div>
                )}

                {/* Action button */}
                {isResting ? (
                  <button 
                    className="guided-btn-done" 
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--sport-volt)', color: 'var(--sport-volt)', margin: '0 auto' }}
                    onClick={() => {
                      clearInterval(restTimerIntervalRef.current);
                      setRestTimeLeft(0);
                      setRestIsActive(false);
                    }}
                  >
                    ⚡️ דלג על המנוחה (התחל סט)
                  </button>
                ) : (
                  <button 
                    className="guided-btn-done" 
                    onClick={() => toggleSetCompletion(activeExerciseIndex, activeSetIndex)}
                    style={{ margin: '0 auto' }}
                  >
                    👍 סיימתי את הסט!
                  </button>
                )}

                {/* Quick Manual navigation */}
                <div className="guided-quick-navigation" style={{ margin: '16px auto 0', maxWidth: '320px' }}>
                  <button 
                    type="button"
                    className="guided-quick-nav-btn"
                    disabled={activeSetIndex === 0 && activeExerciseIndex === 0}
                    onClick={() => {
                      if (activeSetIndex > 0) {
                        setActiveSetIndex(activeSetIndex - 1);
                      } else if (activeExerciseIndex > 0) {
                        const prevEx = activeWorkout.exercises[activeExerciseIndex - 1];
                        setActiveExerciseIndex(activeExerciseIndex - 1);
                        setActiveSetIndex(prevEx.sets.length - 1);
                      }
                      setActiveSetDuration(0);
                    }}
                  >
                    סט קודם
                  </button>
                  <button 
                    type="button"
                    className="guided-quick-nav-btn"
                    disabled={activeExerciseIndex === activeWorkout.exercises.length - 1 && activeSetIndex === currentEx.sets.length - 1}
                    onClick={() => {
                      if (activeSetIndex < currentEx.sets.length - 1) {
                        setActiveSetIndex(activeSetIndex + 1);
                      } else if (activeExerciseIndex < activeWorkout.exercises.length - 1) {
                        setActiveExerciseIndex(activeExerciseIndex + 1);
                        setActiveSetIndex(0);
                      }
                      setActiveSetDuration(0);
                    }}
                  >
                    סט הבא
                  </button>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Floating Sound Toggle Button */}
        <button className="sound-toggle-btn" onClick={() => setSoundEnabled(!soundEnabled)}>
          {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Finish / Quit workout footer bar */}
        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button className="btn btn-secondary" style={{ borderColor: 'var(--sport-orange)', color: 'var(--sport-orange)' }} onClick={handleCancelWorkout}>
            ביטול אימון
          </button>
          
          <button className="btn btn-gold" style={{ padding: '12px 32px' }} onClick={handleFinishWorkout}>
            סיום ושמירת אימון
          </button>
        </div>
      </div>
    );
  }

  // MAIN PAGE LAYOUT
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-wrapper">
            <img src="/logo.jpg" alt="SB Sports Logo" className="logo-img" />
          </div>
          <div>
            <h1 className="app-title text-gold-gradient" style={{ fontSize: '1.5rem', margin: 0 }}>SB SPORTS</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}> workout sync portal </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="user-badge">
            {user.picture ? (
              <img src={user.picture} alt={user.name} style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', marginLeft: 8 }} />
            ) : (
              <div className="user-avatar">{user.name.charAt(0)}</div>
            )}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.role}</div>
            </div>
            <button 
              onClick={handleLogout} 
              style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8, color: 'var(--text-muted)' }}
              title="התנתק"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button 
          className={`nav-tab-btn ${currentTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('dashboard'); setEditingTemplate(null); }}
        >
          <Dumbbell size={16} />
          <span>אימונים</span>
        </button>
        <button 
          className={`nav-tab-btn ${currentTab === 'progress' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('progress'); setEditingTemplate(null); }}
        >
          <Sparkles size={16} />
          <span>התקדמות</span>
        </button>
        <button 
          className={`nav-tab-btn ${currentTab === 'history' ? 'active' : ''}`}
          onClick={() => { setCurrentTab('history'); setEditingTemplate(null); }}
        >
          <Calendar size={16} />
          <span>יומן</span>
        </button>
        <button 
          className={`nav-tab-btn ${currentTab === 'builder' ? 'active' : ''}`}
          onClick={() => {
            setEditingTemplate(null);
            setBuilderName('');
            setBuilderExercises([{ name: 'לחיצת חזה עם מוט (Bench Press)', sets: 3, reps: '10', weight: 60, restTime: 90 }]);
            setCurrentTab('builder');
          }}
        >
          <Plus size={16} />
          <span>כתיבה</span>
        </button>
      </nav>

      {/* Main Content Areas */}
      {loading && (
        <div style={{ textAlign: 'center', margin: '40px 0', color: 'var(--sport-volt)' }}>
          <RefreshCw size={32} className="rest-circle-progress" style={{ animation: 'pulse 1.5s infinite' }} />
          <p style={{ marginTop: 12 }}>טוען נתונים מסונכרנים...</p>
        </div>
      )}

      {!loading && currentTab === 'dashboard' && (
        <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
          {/* Templates list */}
          <div>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="section-title" style={{ margin: 0 }}>תוכניות אימון</h2>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                onClick={() => {
                  setEditingTemplate(null);
                  setBuilderName('');
                  setBuilderExercises([{ name: 'לחיצת חזה עם מוט (Bench Press)', sets: 3, reps: '10', weight: 60, restTime: 90 }]);
                  setCurrentTab('builder');
                }}
              >
                <Plus size={14} /> כתיבת אימון חדש
              </button>
            </div>

            {/* Workouts Section */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                🏋️‍♂️ תוכניות אימון שלי ({myWorkouts.length})
              </h3>
              {myWorkouts.length === 0 ? (
                <div className="glass-panel empty-state" style={{ padding: '24px' }}>
                  <Dumbbell className="empty-state-icon" style={{ width: 28, height: 28, marginBottom: 8 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>טרם יצרת תוכניות אימון.</p>
                </div>
              ) : (
                <div className="workout-templates-list">
                  {myWorkouts.map((w) => (
                    <div key={w.id} className="workout-card">
                      <div>
                        <h3 className="workout-card-title">{w.name}</h3>
                        <div className="workout-card-meta">
                          <span>תרגילים: {w.exercises.length}</span>
                        </div>
                      </div>
                      <div className="workout-card-actions">
                        <button className="btn btn-gold" onClick={() => {
                          setPreWorkoutTemplate(w);
                          setPreWorkoutWeight('');
                          setPreWorkoutBodyFat('');
                          setPreWorkoutSleep(4);
                          setPreWorkoutEnergy(4);
                          setShowPreWorkoutModal(true);
                        }}>
                          <Play size={14} /> התחל אימון
                        </button>
                        <button className="btn btn-secondary" onClick={() => startEditWorkoutTemplate(w)}>
                          <Edit size={14} /> ערוך
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteWorkoutTemplate(w.id, w.name)}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warmups Section */}
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 14, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                🤸‍♂️ תוכניות חימום שלי ({myWarmups.length})
              </h3>
              {myWarmups.length === 0 ? (
                <div className="glass-panel empty-state" style={{ padding: '24px' }}>
                  <Dumbbell className="empty-state-icon" style={{ width: 28, height: 28, marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>טרם יצרת תוכניות חימום.</p>
                </div>
              ) : (
                <div className="workout-templates-list">
                  {myWarmups.map((w) => (
                    <div key={w.id} className="workout-card">
                      <div>
                        <h3 className="workout-card-title">{w.name}</h3>
                        <div className="workout-card-meta">
                          <span>תרגילים: {w.exercises.length}</span>
                        </div>
                      </div>
                      <div className="workout-card-actions">
                        <button className="btn btn-gold" onClick={() => {
                          setPreWorkoutTemplate(w);
                          setPreWorkoutWeight('');
                          setPreWorkoutBodyFat('');
                          setPreWorkoutSleep(4);
                          setPreWorkoutEnergy(4);
                          setShowPreWorkoutModal(true);
                        }}>
                          <Play size={14} /> התחל חימום
                        </button>
                        <button className="btn btn-secondary" onClick={() => startEditWorkoutTemplate(w)}>
                          <Edit size={14} /> ערוך
                        </button>
                        <button className="btn btn-danger" onClick={() => handleDeleteWorkoutTemplate(w.id, w.name)}>
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Coach Upgrades Section */}
            <div style={{ marginTop: 32 }}>
              <h2 className="section-title">
                <Sparkles size={18} style={{ color: 'var(--sport-volt)', marginLeft: 8 }} />
                שדרוגים והצעות לאימון הבא
              </h2>
              <div className="glass-panel" style={{ borderLeft: '3px solid var(--sport-volt)', background: 'rgba(204, 255, 0, 0.01)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {getCoachSuggestions().map((s, idx) => (
                    <div key={idx} style={{ paddingBottom: idx < getCoachSuggestions().length - 1 ? 12 : 0, borderBottom: idx < getCoachSuggestions().length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                      <div style={{ fontWeight: 'bold', color: 'var(--sport-volt)', marginBottom: 4 }}>{s.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '140%' }}>{s.desc}</div>
                    </div>
                  ))}
                  
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.01)' }} onClick={() => handleAutoGenerateWorkout('strength')}>
                      ⚡ צור אימון כוח מומלץ (5x5)
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '8px 12px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.01)' }} onClick={() => handleAutoGenerateWorkout('hypertrophy')}>
                      ⚡ צור אימון נפח מומלץ (היפרטרופיה)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && currentTab === 'progress' && (
        <div>
          <h2 className="section-title" style={{ marginBottom: 20 }}>התקדמות אישית</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
            {/* User Profile Summary Card */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
                {user.picture ? (
                  <img src={user.picture} alt={user.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div className="user-avatar" style={{ width: 64, height: 64, fontSize: '1.8rem', borderRadius: '50%', background: 'var(--sport-volt)', color: '#000', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {user.name.charAt(0)}
                  </div>
                )}
                <div style={{ textAlign: 'right' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{user.name}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 4 }}>חשבון מחובר: {user.username}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="glass-panel" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: 16 }}>
                  <div className="user-stat-number" style={{ fontSize: '2.2rem', color: 'var(--sport-volt)', fontFamily: 'var(--font-latin)', fontWeight: '900' }}>
                    {currentUserStat.workoutCount || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>אימונים שבוצעו</div>
                </div>

                <div className="glass-panel" style={{ textAlign: 'center', background: 'rgba(255,255,255,0.01)', padding: 16 }}>
                  <div className="user-stat-number" style={{ fontSize: '1.1rem', color: '#fff', minHeight: '52px', display: 'flex', alignItems: 'center', justifyContent: 'center', direction: 'ltr', fontFamily: 'var(--font-latin)', fontWeight: 'bold' }}>
                    {currentUserStat.lastWorkoutDate ? new Date(currentUserStat.lastWorkoutDate).toLocaleDateString('he-IL') : 'מעולם לא'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 4 }}>אימון אחרון (לועזי)</div>
                </div>
              </div>

              {currentUserStat.lastWorkoutDate && (
                <div className="glass-panel" style={{ textAlign: 'center', background: 'rgba(204, 255, 0, 0.03)', borderColor: 'rgba(204, 255, 0, 0.1)', padding: 12, marginTop: 16 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>תאריך עברי של האימון האחרון:</span>
                  <div style={{ fontSize: '1.1rem', color: 'var(--sport-volt)', fontWeight: 'bold', marginTop: 4 }}>
                    {formatHebrewDate(currentUserStat.lastWorkoutDate)}
                  </div>
                </div>
              )}
            </div>

            {/* WEIGHT PROGRESS GRAPH (לוח שנה עברי) */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                📈 גרף התקדמות משקל גוף
              </h3>
              
              {(() => {
                const myStats = userStats.filter(s => s.username === user?.username) || [];
                if (myStats.length === 0) {
                  return (
                    <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      טרם נרשמו מדדי גוף. נתוני משקל הגוף שיוזנו לפני תחילת האימונים יוצגו כאן כגרף התקדמות.
                    </div>
                  );
                }

                const width = 500;
                const height = 180;
                const padding = 30;

                const weights = myStats.map(s => s.weight);
                const minWeight = Math.min(...weights) - 2;
                const maxWeight = Math.max(...weights) + 2;
                const weightRange = maxWeight - minWeight || 1;

                const points = myStats.map((s, idx) => {
                  const x = padding + (idx / (myStats.length - 1 || 1)) * (width - 2 * padding);
                  const y = height - padding - ((s.weight - minWeight) / weightRange) * (height - 2 * padding);
                  return { x, y, ...s };
                });

                const pathData = points.length > 1
                  ? `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`
                  : '';

                return (
                  <div style={{ width: '100%', overflowX: 'auto', direction: 'ltr' }}>
                    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', minWidth: '400px' }}>
                      {/* Grid lines */}
                      <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1={padding} y1={height/2} x2={width - padding} y2={height/2} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

                      {/* Graph Path */}
                      {points.length > 1 && (
                        <path
                          d={pathData}
                          fill="none"
                          stroke="var(--sport-volt)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="drop-shadow(0 0 4px rgba(204, 255, 0, 0.2))"
                        />
                      )}

                      {/* Data Points */}
                      {points.map((p, idx) => (
                        <g key={p.id || idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r="5"
                            fill="#000"
                            stroke="var(--sport-volt)"
                            strokeWidth="2.5"
                          />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            fill="#fff"
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                            fontFamily="var(--font-latin)"
                          >
                            {p.weight}
                          </text>
                          {/* Hebrew Date under points */}
                          <text
                            x={p.x}
                            y={height - 12}
                            fill="var(--text-secondary)"
                            fontSize="8"
                            textAnchor="middle"
                          >
                            {p.hebrewDate ? p.hebrewDate.split(' ').slice(0, 2).join(' ') : ''}
                          </text>
                        </g>
                      ))}
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* HEBREW CALENDAR JOURNAL / STATS HISTORY TABLE */}
            <div className="glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 16 }}>
                📆 היסטוריית מדדי גוף (לוח עברי)
              </h3>
              
              {(() => {
                const myStats = userStats.filter(s => s.username === user?.username) || [];
                if (myStats.length === 0) {
                  return (
                    <div style={{ padding: '12px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      לא נמצאו מדדים רשומים.
                    </div>
                  );
                }

                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="sets-logger-table" style={{ width: '100%', fontSize: '0.85rem' }}>
                      <thead>
                        <tr>
                          <th>תאריך עברי</th>
                          <th>משקל</th>
                          <th>שומן %</th>
                          <th>שינה</th>
                          <th>אנרגיה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...myStats].reverse().map((s) => (
                          <tr key={s.id}>
                            <td style={{ fontWeight: 'bold', color: 'var(--sport-volt)' }}>{s.hebrewDate || 'לא זמין'}</td>
                            <td style={{ fontFamily: 'var(--font-latin)' }}>{s.weight} ק״ג</td>
                            <td style={{ fontFamily: 'var(--font-latin)' }}>{s.bodyFat ? `${s.bodyFat}%` : '-'}</td>
                             <td>
                               <div>{Array(s.sleepQuality || 0).fill('★').join('') || '-'}</div>
                               {s.sleepStart && s.sleepEnd && (
                                 <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                   {s.sleepStart}-{s.sleepEnd} ({calculateSleepDuration(s.sleepStart, s.sleepEnd)} ש׳)
                                 </div>
                               )}
                             </td>
                            <td>{Array(s.energyLevel || 0).fill('★').join('') || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {!loading && currentTab === 'history' && (
        <div>
          <h2 className="section-title" style={{ marginBottom: 20 }}>יומן האימונים שלי</h2>

          {/* INTERACTIVE HEBREW-GREGORIAN CALENDAR */}
          <div className="glass-panel" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
              >
                →
              </button>
              
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold' }}>
                  {calendarDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--sport-volt)', fontWeight: 'bold' }}>
                  {getHebrewMonthSpan(calendarDate)}
                </span>
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ padding: '6px 12px' }}
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
              >
                ←
              </button>
            </div>

            {/* Weekdays Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 6 }}>
              {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(dayName => (
                <span key={dayName} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                  {dayName}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {(() => {
                const year = calendarDate.getFullYear();
                const month = calendarDate.getMonth();
                const firstDayIndex = new Date(year, month, 1).getDay();
                const totalDays = new Date(year, month + 1, 0).getDate();
                
                const cells = [];
                // Padding cells
                for (let i = 0; i < firstDayIndex; i++) {
                  cells.push(<div key={`pad-${i}`} />);
                }
                
                const getLocalDateString = (d) => {
                  if (!d) return '';
                  const date = new Date(d);
                  const y = date.getFullYear();
                  const m = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${y}-${m}-${day}`;
                };

                // Actual day cells
                for (let d = 1; d <= totalDays; d++) {
                  const cellDate = new Date(year, month, d);
                  const yearStr = cellDate.getFullYear();
                  const monthStr = String(cellDate.getMonth() + 1).padStart(2, '0');
                  const dateStr = String(cellDate.getDate()).padStart(2, '0');
                  const dayStr = `${yearStr}-${monthStr}-${dateStr}`;
                  
                  const isToday = getLocalDateString(new Date()) === dayStr;
                  const isSelected = selectedCalendarDay === dayStr;
                  
                  const dayLogs = myLogs.filter(log => getLocalDateString(log.completedAt) === dayStr);
                  const dayMetrics = userStats.filter(s => s.username === user?.username && getLocalDateString(s.date) === dayStr);
                  
                  cells.push(
                    <button
                      key={`day-${d}`}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDay(dayStr);
                        setIsEditingCalendarMetrics(false);
                        if (dayMetrics.length > 0) {
                          const latest = dayMetrics[dayMetrics.length - 1];
                          setCalendarEditWeight(String(latest.weight));
                          setCalendarEditBodyFat(latest.bodyFat ? String(latest.bodyFat) : '');
                          setCalendarEditSleep(latest.sleepQuality || 4);
                          setCalendarEditEnergy(latest.energyLevel || 4);
                        } else {
                          setCalendarEditWeight('');
                          setCalendarEditBodyFat('');
                          setCalendarEditSleep(4);
                          setCalendarEditEnergy(4);
                        }
                      }}
                      style={{
                        background: isSelected 
                          ? 'rgba(204, 255, 0, 0.15)' 
                          : isToday 
                            ? 'rgba(255, 255, 255, 0.08)' 
                            : 'rgba(255, 255, 255, 0.02)',
                        border: isSelected 
                          ? '1px solid var(--sport-volt)' 
                          : isToday 
                            ? '1px solid rgba(255, 255, 255, 0.3)' 
                            : '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '6px 4px',
                        minHeight: '48px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {/* Dates */}
                      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', padding: '0 2px', fontSize: '0.75rem', fontFamily: 'var(--font-latin)' }}>
                        <span style={{ color: 'var(--sport-volt)', fontSize: '0.62rem' }}>
                          {getHebrewCalendarDay(cellDate)}
                        </span>
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{d}</span>
                      </div>

                      {/* Dots indicators */}
                      <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                        {dayLogs.length > 0 && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#30d158', display: 'inline-block' }} />
                        )}
                        {dayMetrics.length > 0 && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sport-volt)', display: 'inline-block' }} />
                        )}
                      </div>
                    </button>
                  );
                }
                return cells;
              })()}
            </div>
          </div>

          {/* SELECTED DAY DETAILS */}
          {selectedCalendarDay && (
            <div className="glass-panel" style={{ padding: 20, marginBottom: 24, borderColor: 'rgba(204, 255, 0, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#fff' }}>
                    📅 {new Date(selectedCalendarDay).toLocaleDateString('he-IL', { dateStyle: 'full' })}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--sport-volt)', fontWeight: 'bold' }}>
                    עברי: {getHebrewFullDate(new Date(selectedCalendarDay))}
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                  onClick={() => setSelectedCalendarDay(null)}
                >
                  סגור
                </button>
              </div>

              {/* Day Metrics Section */}
              <div style={{ marginBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--sport-volt)' }}>⚖️ מדדי גוף ליום זה</h4>
                  {!isEditingCalendarMetrics && (
                    <button 
                      type="button"
                      className="btn btn-gold"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                      onClick={() => {
                        const getLocalDateString = (d) => {
                          if (!d) return '';
                          const date = new Date(d);
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${y}-${m}-${day}`;
                        };
                        const dayMetrics = userStats.filter(s => s.username === user?.username && getLocalDateString(s.date) === selectedCalendarDay);
                        if (dayMetrics.length > 0) {
                          const latest = dayMetrics[dayMetrics.length - 1];
                          setCalendarEditWeight(String(latest.weight));
                          setCalendarEditBodyFat(latest.bodyFat ? String(latest.bodyFat) : '');
                          setCalendarEditSleep(latest.sleepQuality || 4);
                          setCalendarEditEnergy(latest.energyLevel || 4);
                        }
                        setIsEditingCalendarMetrics(true);
                      }}
                    >
                      {userStats.some(s => {
                        const getLocalDateString = (d) => {
                          if (!d) return '';
                          const date = new Date(d);
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          return `${y}-${m}-${day}`;
                        };
                        return s.username === user?.username && getLocalDateString(s.date) === selectedCalendarDay;
                      }) ? 'ערוך מדדים' : 'הוסף מדדים'}
                    </button>
                  )}
                </div>

                {isEditingCalendarMetrics ? (
                  <form onSubmit={handleSaveCalendarDayMetrics} style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>משקל גוף (ק״ג):</label>
                        <input 
                          type="number" 
                          step="any"
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={calendarEditWeight} 
                          onChange={(e) => setCalendarEditWeight(e.target.value)} 
                          placeholder="משקל"
                          required
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>אחוז שומן (%, רשות):</label>
                        <input 
                          type="number" 
                          step="any"
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={calendarEditBodyFat} 
                          onChange={(e) => setCalendarEditBodyFat(e.target.value)} 
                          placeholder="שומן %"
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>שינה:</label>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCalendarEditSleep(star)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0, color: star <= calendarEditSleep ? 'var(--sport-volt)' : '#3a3a3c' }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 2 }}>רמת אנרגיה:</label>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {[1,2,3,4,5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setCalendarEditEnergy(star)}
                              style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', padding: 0, color: star <= calendarEditEnergy ? 'var(--sport-volt)' : '#3a3a3c' }}
                            >
                              ★
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>שעת תחילת שינה:</label>
                        <input 
                          type="time" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={calendarEditSleepStart} 
                          onChange={(e) => setCalendarEditSleepStart(e.target.value)} 
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>שעת יקיצה:</label>
                        <input 
                          type="time" 
                          className="form-input" 
                          style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                          value={calendarEditSleepEnd} 
                          onChange={(e) => setCalendarEditSleepEnd(e.target.value)} 
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
                        onClick={() => setIsEditingCalendarMetrics(false)}
                      >
                        ביטול
                      </button>
                      <button 
                        type="submit" 
                        className="btn btn-gold" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                      >
                        שמור מדדים
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    {(() => {
                      const getLocalDateString = (d) => {
                        if (!d) return '';
                        const date = new Date(d);
                        const y = date.getFullYear();
                        const m = String(date.getMonth() + 1).padStart(2, '0');
                        const day = String(date.getDate()).padStart(2, '0');
                        return `${y}-${m}-${day}`;
                      };
                      const dayMetrics = userStats.filter(s => s.username === user?.username && getLocalDateString(s.date) === selectedCalendarDay);
                      if (dayMetrics.length === 0) {
                        return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>לא נרשמו מדדי גוף ליום זה.</p>;
                      }
                      const latest = dayMetrics[dayMetrics.length - 1];
                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>משקל גוף:</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-latin)' }}>{latest.weight} ק״ג</div>
                          </div>
                          <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>אחוז שומן:</span>
                            <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-latin)' }}>{latest.bodyFat ? `${latest.bodyFat}%` : '-'}</div>
                          </div>
                           <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                             <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>איכות שינה:</span>
                             <div style={{ fontSize: '1rem', color: 'var(--sport-volt)' }}>{Array(latest.sleepQuality || 0).fill('★').join('') || '-'}</div>
                             {latest.sleepStart && latest.sleepEnd && (
                               <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                                 שינה: {latest.sleepStart} עד {latest.sleepEnd} ({calculateSleepDuration(latest.sleepStart, latest.sleepEnd)} ש׳)
                               </div>
                             )}
                           </div>
                          <div style={{ background: 'rgba(255,255,255,0.01)', padding: 8, borderRadius: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>רמת אנרגיה:</span>
                            <div style={{ fontSize: '1rem', color: 'var(--sport-volt)' }}>{Array(latest.energyLevel || 0).fill('★').join('') || '-'}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Day Workouts Section */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--sport-volt)', marginBottom: 8 }}>💪 אימונים שבוצעו ביום זה</h4>
                {(() => {
                  const getLocalDateString = (d) => {
                    if (!d) return '';
                    const date = new Date(d);
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                  };
                  const dayLogs = myLogs.filter(log => getLocalDateString(log.completedAt) === selectedCalendarDay);
                  if (dayLogs.length === 0) {
                    return <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>לא בוצעו אימונים ביום זה.</p>;
                  }
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {dayLogs.map(log => (
                        <div key={log.id} style={{ background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.85rem' }}>{log.name}</span>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>משך זמן: {formatTime(log.duration)}</div>
                          </div>
                          <button 
                            type="button" 
                            className="btn btn-danger" 
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            onClick={() => handleDeleteLog(log.id, log.name)}
                          >
                            מחק
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: 14, marginTop: 28 }}>
            📋 רשימת אימונים קודמים ({myLogs.length})
          </h3>

          {myLogs.length === 0 ? (
            <div className="glass-panel empty-state">
              <Calendar className="empty-state-icon" />
              <h3>יומן האימונים ריק</h3>
              <p>לאחר שתשלים ותשמור אימון, התיעוד שלו יופיע כאן.</p>
            </div>
          ) : (
            <div className="history-list">
              {myLogs.map((log) => {
                return (
                  <div key={log.id} className="history-card">
                    <div className="history-card-header">
                      <div>
                        <h3 className="history-card-title">{log.name}</h3>
                        <div className="history-card-meta">
                          <div className="meta-item">
                            <Clock size={14} />
                            <span>משך זמן: {formatTime(log.duration)}</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span>לועזי: {formatDate(log.completedAt)}</span>
                          </div>
                          <div className="meta-item">
                            <Calendar size={14} />
                            <span style={{ color: 'var(--sport-volt)' }}>עברי: <strong>{formatHebrewDate(log.completedAt)}</strong></span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="btn btn-danger" 
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLog(log.id, log.name);
                        }}
                      >
                        מחק תיעוד
                      </button>
                    </div>

                    <div className="history-card-details">
                      {log.exercises.map((ex, eIdx) => (
                        <div key={eIdx} className="history-exercise-row">
                          <div className="history-exercise-name">{ex.name}</div>
                          <div className="history-sets-row">
                            {ex.sets.map((set, sIdx) => {
                              const sType = set.type || 'regular';
                              if (ex.isSuperset) {
                                return (
                                  <div key={sIdx} className={`history-set-badge type-${sType} ${set.completed ? 'completed' : ''}`} style={{ display: 'block', width: '100%', marginBottom: 4, padding: '8px 12px' }}>
                                    <span style={{ fontWeight: 'bold', color: 'var(--sport-volt)' }}>סט {set.setNumber}:</span>
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 4, marginRight: 8 }}>
                                      {(set.subResults || []).map((sr, srIdx) => (
                                        <span key={srIdx} style={{ fontSize: '0.8rem', color: '#fff' }}>
                                          🏃‍♂️ {sr.name}: <strong style={{ color: 'var(--sport-volt)' }}>{sr.weight} ק״ג &times; {sr.reps}</strong>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <div key={sIdx} className={`history-set-badge type-${sType} ${set.completed ? 'completed' : ''}`}>
                                  {sType === 'warmup' && 'חימום | '}
                                  {sType === 'drop' && 'דרופ | '}
                                  {sType === 'failure' && 'כשל | '}
                                  סט {set.setNumber}: {set.weight} ק״ג × {set.reps}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loading && currentTab === 'builder' && (
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <button className="btn btn-secondary" onClick={() => setCurrentTab('dashboard')} style={{ padding: '8px 12px' }}>
              <ArrowLeft size={16} />
            </button>
            <h2 className="section-title" style={{ margin: 0 }}>
              {editingTemplate ? `עריכת אימון: ${editingTemplate.name}` : 'כתיבת תוכנית אימון חדשה'}
            </h2>
          </div>

          <form onSubmit={handleSaveWorkoutTemplate} className="builder-form">
            <div className="auth-form-group">
              <label className="auth-form-label">שם תוכנית האימון:</label>
              <input 
                type="text" 
                className="form-input" 
                value={builderName} 
                onChange={(e) => setBuilderName(e.target.value)} 
                placeholder="לדוגמה: אימון גב ויד קדמית"
                required
              />
            </div>

            <div className="auth-form-group">
              <label className="auth-form-label" style={{ marginBottom: 8 }}>סוג התוכנית:</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className={`btn ${builderType === 'workout' ? 'btn-gold' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.9rem', justifyContent: 'center' }}
                  onClick={() => setBuilderType('workout')}
                >
                  🏋️‍♂️ תוכנית אימון (Workout)
                </button>
                <button
                  type="button"
                  className={`btn ${builderType === 'warmup' ? 'btn-gold' : 'btn-secondary'}`}
                  style={{ flex: 1, padding: '10px 16px', fontSize: '0.9rem', justifyContent: 'center' }}
                  onClick={() => setBuilderType('warmup')}
                >
                  🤸‍♂️ תוכנית חימום (Warmup)
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>רשימת תרגילים</h3>
                <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={addBuilderExercise}>
                  <PlusCircle size={14} /> הוסף תרגיל
                </button>
              </div>

              <div className="builder-exercises-list">
                {builderExercises.map((ex, idx) => (
                  <div key={idx} className="builder-exercise-card">
                    <div className="builder-exercise-header">
                      <span className="exercise-index">{idx + 1}</span>
                      <button 
                        type="button" 
                        className="btn btn-danger" 
                        style={{ padding: '4px 8px' }} 
                        onClick={() => removeBuilderExercise(idx)}
                        disabled={builderExercises.length <= 1}
                      >
                        הסר
                      </button>
                    </div>

                    <div className="builder-exercise-grid">
                      {/* Predefined selection */}
                      <div className="form-group-builder form-group-name">
                        <span className="builder-label">שם התרגיל:</span>
                        <div className="builder-select-wrapper" onClick={(e) => e.stopPropagation()}>
                          <input 
                            type="text" 
                            className="form-input" 
                            value={ex.name} 
                            readOnly={ex.isSuperset}
                            onChange={(e) => {
                              if (!ex.isSuperset) {
                                updateBuilderExerciseField(idx, 'name', e.target.value);
                                setExerciseSearchTerm(e.target.value);
                              }
                            }} 
                            onFocus={() => {
                              if (!ex.isSuperset) {
                                setActiveDropdownIndex(idx);
                                setExerciseSearchTerm(ex.name);
                              }
                            }}
                            placeholder={ex.isSuperset ? "שם הסופר-סט מיוצר אוטומטית..." : "הקלד או בחר תרגיל..."} 
                            required
                          />
                          {!ex.isSuperset && activeDropdownIndex === idx && (
                            <div className="builder-select-dropdown">
                              {['push', 'pull', 'legs', 'arms', 'core'].map((cat) => {
                                const exercisesInCat = PRESET_EXERCISES.filter(
                                  pe => pe.category === cat && 
                                  pe.name.toLowerCase().includes((exerciseSearchTerm || '').toLowerCase())
                                );
                                
                                if (exercisesInCat.length === 0) return null;
                                
                                return (
                                  <div key={cat}>
                                    <div className="builder-select-category">
                                      {cat === 'push' && 'דחיפה (חזה / כתפיים)'}
                                      {cat === 'pull' && 'משיכה (גב)'}
                                      {cat === 'legs' && 'רגליים'}
                                      {cat === 'arms' && 'ידיים'}
                                      {cat === 'core' && 'בטן וליבה'}
                                    </div>
                                    {exercisesInCat.map((pe, pIdx) => (
                                      <div 
                                        key={pIdx} 
                                        className="builder-select-option"
                                        onClick={() => selectPresetExercise(idx, pe)}
                                      >
                                        {pe.name}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercise Type Toggle */}
                      <div className="form-group-builder" style={{ gridColumn: 'span 6' }}>
                        <span className="builder-label">סוג תרגיל:</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className={`btn ${ex.type === 'warmup' ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, borderRadius: '10px' }}
                            onClick={() => updateBuilderExerciseField(idx, 'type', 'warmup')}
                          >
                            חימום (Warmup)
                          </button>
                          <button
                            type="button"
                            className={`btn ${ex.type !== 'warmup' ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, borderRadius: '10px' }}
                            onClick={() => updateBuilderExerciseField(idx, 'type', 'workout')}
                          >
                            אימון (Workout)
                          </button>
                        </div>
                      </div>

                      {/* Exercise Structure Toggle */}
                      <div className="form-group-builder" style={{ gridColumn: 'span 6' }}>
                        <span className="builder-label">מבנה תרגיל:</span>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            className={`btn ${!ex.isSuperset ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, borderRadius: '10px' }}
                            onClick={() => updateBuilderExerciseField(idx, 'isSuperset', false)}
                          >
                            תרגיל רגיל
                          </button>
                          <button
                            type="button"
                            className={`btn ${ex.isSuperset ? 'btn-gold' : 'btn-secondary'}`}
                            style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1, borderRadius: '10px' }}
                            onClick={() => {
                              updateBuilderExerciseField(idx, 'isSuperset', true);
                              if (!ex.subExercises || ex.subExercises.length === 0) {
                                updateBuilderExerciseField(idx, 'subExercises', [
                                  { name: '', reps: ex.reps || '10', weight: ex.weight || 0 },
                                  { name: '', reps: ex.reps || '10', weight: ex.weight || 0 }
                                ]);
                              }
                            }}
                          >
                            סופר-סט / קומבו
                          </button>
                        </div>
                      </div>

                      {/* Superset Sub-exercises builder panel */}
                      {ex.isSuperset && (
                        <div style={{ gridColumn: 'span 12', marginTop: 8, padding: '12px 16px', background: 'rgba(255,255,255,0.01)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontWeight: 'bold' }}>🏃‍♂️ תרגילים המרכיבים את הסופר-סט:</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(ex.subExercises || []).map((sub, subIdx) => (
                              <div key={subIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--sport-volt)', fontWeight: 'bold', minWidth: '20px' }}>{subIdx + 1}.</span>
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ flex: 2, minWidth: '140px', padding: '6px 12px', fontSize: '0.85rem' }}
                                  placeholder="שם התרגיל (למשל: שכיבות שמיכה)"
                                  value={sub.name || ''}
                                  onChange={(e) => {
                                    const updatedSubs = [...(ex.subExercises || [])];
                                    updatedSubs[subIdx] = { ...updatedSubs[subIdx], name: e.target.value };
                                    updateBuilderExerciseField(idx, 'subExercises', updatedSubs);
                                    
                                    // Auto-generate main name
                                    const validNames = updatedSubs.map(s => s.name || '').filter(n => n.trim() !== '');
                                    if (validNames.length > 0) {
                                      updateBuilderExerciseField(idx, 'name', `סופר-סט: ${validNames.join(' + ')}`);
                                    }
                                  }}
                                  required
                                />
                                <input
                                  type="text"
                                  className="form-input"
                                  style={{ flex: 1, minWidth: '60px', padding: '6px 10px', fontSize: '0.85rem', textAlign: 'center' }}
                                  placeholder="חזרות"
                                  value={sub.reps || ''}
                                  onChange={(e) => {
                                    const updatedSubs = [...(ex.subExercises || [])];
                                    updatedSubs[subIdx] = { ...updatedSubs[subIdx], reps: e.target.value };
                                    updateBuilderExerciseField(idx, 'subExercises', updatedSubs);
                                  }}
                                  required
                                />
                                <input
                                  type="number"
                                  step="any"
                                  className="form-input"
                                  style={{ flex: 1, minWidth: '60px', padding: '6px 10px', fontSize: '0.85rem', textAlign: 'center' }}
                                  placeholder="משקל"
                                  value={sub.weight || 0}
                                  onChange={(e) => {
                                    const updatedSubs = [...(ex.subExercises || [])];
                                    updatedSubs[subIdx] = { ...updatedSubs[subIdx], weight: parseFloat(e.target.value) || 0 };
                                    updateBuilderExerciseField(idx, 'subExercises', updatedSubs);
                                  }}
                                  required
                                />
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                                  onClick={() => {
                                    const updatedSubs = ex.subExercises.filter((_, sIndex) => sIndex !== subIdx);
                                    updateBuilderExerciseField(idx, 'subExercises', updatedSubs);
                                    const validNames = updatedSubs.map(s => s.name || '').filter(n => n.trim() !== '');
                                    updateBuilderExerciseField(idx, 'name', `סופר-סט: ${validNames.join(' + ')}`);
                                  }}
                                  disabled={(ex.subExercises || []).length <= 2}
                                >
                                  הסר
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ width: '100%', padding: '6px', fontSize: '0.8rem', marginTop: 4 }}
                              onClick={() => {
                                updateBuilderExerciseField(idx, 'subExercises', [...(ex.subExercises || []), { name: '', reps: ex.reps || '10', weight: ex.weight || 0 }]);
                              }}
                            >
                              ➕ הוסף תרגיל לסופר-סט
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="form-group-builder form-group-numeric">
                        <span className="builder-label">מספר סטים:</span>
                        <input 
                          type="number" 
                          min="1"
                          className="form-input" 
                          value={ex.sets} 
                          onChange={(e) => updateBuilderExerciseField(idx, 'sets', e.target.value)} 
                          required
                        />
                      </div>

                      <div className="form-group-builder form-group-numeric">
                        <span className="builder-label">חזרות לסט:</span>
                        <input 
                          type="text" 
                          className="form-input" 
                          value={ex.reps} 
                          onChange={(e) => updateBuilderExerciseField(idx, 'reps', e.target.value)} 
                          placeholder="לדוגמה: 12"
                          required
                        />
                      </div>

                      <div className="form-group-builder form-group-numeric">
                        <span className="builder-label">משקל יעד (ק״ג):</span>
                        <input 
                          type="number" 
                          step="any"
                          className="form-input" 
                          value={ex.weight} 
                          onChange={(e) => updateBuilderExerciseField(idx, 'weight', e.target.value)} 
                          required
                        />
                      </div>

                      <div className="form-group-builder form-group-numeric">
                        <span className="builder-label">זמן מנוחה (שניות):</span>
                        <input 
                          type="number" 
                          min="0"
                          className="form-input" 
                          value={ex.restTime} 
                          onChange={(e) => updateBuilderExerciseField(idx, 'restTime', e.target.value)} 
                          required
                        />
                      </div>
                    </div>

                    {/* Detailed sets type configuration in builder */}
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: 16 }}>
                      <span className="builder-label" style={{ display: 'block', marginBottom: 12, color: 'var(--sport-volt)', fontWeight: 'bold' }}>
                        ⚙️ הגדרת סטים מפורטת (חימום / דרופ / כשל):
                      </span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {Array.from({ length: parseInt(ex.sets) || 1 }).map((_, sIdx) => {
                          const sd = (ex.setsDetail && ex.setsDetail[sIdx]) || { type: 'regular', reps: ex.reps || '10', weight: ex.weight || 0 };
                          return (
                            <div key={sIdx} style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', minWidth: '42px', fontWeight: 'bold' }}>סט {sIdx + 1}:</span>
                              
                              <div style={{ flex: 2, minWidth: '110px' }}>
                                <select 
                                  className="form-input" 
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                                  value={sd.type || 'regular'}
                                  onChange={(e) => updateBuilderSetDetailField(idx, sIdx, 'type', e.target.value)}
                                >
                                  <option value="regular">סט רגיל (Regular)</option>
                                  <option value="warmup">חימום (Warmup)</option>
                                  <option value="drop">דרופ סט (Drop Set)</option>
                                  <option value="failure">עד כשל (To Failure)</option>
                                </select>
                              </div>

                              <div style={{ flex: 1, minWidth: '70px' }}>
                                <input 
                                  type="number" 
                                  step="any"
                                  className="form-input" 
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', textAlign: 'center', width: '100%' }}
                                  placeholder="משקל"
                                  value={sd.weight}
                                  onChange={(e) => updateBuilderSetDetailField(idx, sIdx, 'weight', e.target.value)}
                                />
                              </div>

                              <div style={{ flex: 1, minWidth: '70px' }}>
                                <input 
                                  type="text" 
                                  className="form-input" 
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', textAlign: 'center', width: '100%' }}
                                  placeholder="חזרות"
                                  value={sd.reps}
                                  onChange={(e) => updateBuilderSetDetailField(idx, sIdx, 'reps', e.target.value)}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setCurrentTab('dashboard')}>
                ביטול
              </button>
              <button type="submit" className="btn btn-gold">
                <Save size={16} /> שמור תוכנית
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Pre-Workout Metrics Modal Overlay */}
      {showPreWorkoutModal && (
        <div className="modal-overlay" style={{ display: 'flex', direction: 'rtl', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="modal-card glass-panel" style={{ maxWidth: '420px', width: '100%', padding: '24px', borderRadius: '24px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
            <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 12px', fontSize: '1.3rem', color: 'var(--sport-volt)' }}>
              ⚖️ מדדי גוף לפני אימון
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: 20, lineHeight: '140%' }}>
              הזן את משקל הגוף ומדדי ההרגשה שלך כעת. הנתונים ישמרו ביומן האישי עם תאריך לועזי ועברי.
            </p>
            
            <form onSubmit={handlePreWorkoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="auth-form-group" style={{ marginBottom: 0 }}>
                <label className="auth-form-label" style={{ fontSize: '0.85rem' }}>משקל גוף נוכחי (ק״ג):</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={preWorkoutWeight} 
                  onChange={(e) => setPreWorkoutWeight(e.target.value)} 
                  placeholder="לדוגמה: 78.4"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {preWorkoutTemplate && (preWorkoutTemplate.type === 'workout' || !preWorkoutTemplate.type) && myWarmups.length > 0 && (
                <div className="auth-form-group" style={{ marginBottom: 0 }}>
                  <label className="auth-form-label" style={{ fontSize: '0.85rem' }}>🔥 בצע חימום לפני האימון (מומלץ):</label>
                  <select 
                    className="form-input" 
                    value={preWorkoutWarmupId} 
                    onChange={(e) => setPreWorkoutWarmupId(e.target.value)}
                    style={{ width: '100%', padding: '10px' }}
                  >
                    <option value="">ללא חימום - התחל אימון ישירות</option>
                    {myWarmups.map(warmup => (
                      <option key={warmup.id} value={warmup.id}>
                        {warmup.name} ({warmup.exercises.length} תרגילים)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="auth-form-group" style={{ marginBottom: 0 }}>
                <label className="auth-form-label" style={{ fontSize: '0.85rem' }}>אחוז שומן (%, אופציונלי):</label>
                <input 
                  type="number" 
                  step="any"
                  className="form-input" 
                  value={preWorkoutBodyFat} 
                  onChange={(e) => setPreWorkoutBodyFat(e.target.value)} 
                  placeholder="לדוגמה: 14.5"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="auth-form-group" style={{ marginBottom: 0 }}>
                <span className="auth-form-label" style={{ fontSize: '0.85rem', display: 'block', marginBottom: 8 }}>האם ברצונך להזין מדדים ליום אחר?</span>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowPreWorkoutCustomDate(false)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: !showPreWorkoutCustomDate ? 'rgba(204, 255, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: !showPreWorkoutCustomDate ? 'var(--sport-volt)' : '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    היום ({new Date().toLocaleDateString('he-IL', {day: 'numeric', month: 'short'})})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPreWorkoutCustomDate(true);
                      if (!preWorkoutCustomDate) {
                        setPreWorkoutCustomDate(new Date().toISOString().split('T')[0]);
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '12px',
                      border: '1px solid var(--border-color)',
                      background: showPreWorkoutCustomDate ? 'rgba(204, 255, 0, 0.15)' : 'rgba(255,255,255,0.02)',
                      color: showPreWorkoutCustomDate ? 'var(--sport-volt)' : '#fff',
                      fontSize: '0.85rem',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    יום אחר...
                  </button>
                </div>
              </div>

              {showPreWorkoutCustomDate && (
                <div className="auth-form-group" style={{ marginBottom: 0 }}>
                  <label className="auth-form-label" style={{ fontSize: '0.85rem' }}>בחר תאריך:</label>
                  <input 
                    type="date" 
                    className="form-input" 
                    value={preWorkoutCustomDate} 
                    onChange={(e) => setPreWorkoutCustomDate(e.target.value)} 
                    style={{ width: '100%' }}
                  />
                </div>
              )}

              <div className="auth-form-group" style={{ marginBottom: 0 }}>
                <label className="auth-form-label" style={{ marginBottom: 4, fontSize: '0.85rem' }}>איכות השינה בלילה האחרון:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPreWorkoutSleep(star)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.6rem', color: star <= preWorkoutSleep ? 'var(--sport-volt)' : '#3a3a3c', padding: 0 }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="auth-form-label" style={{ fontSize: '0.8rem', marginBottom: 4 }}>שעת תחילת שינה:</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={preWorkoutSleepStart} 
                    onChange={(e) => setPreWorkoutSleepStart(e.target.value)} 
                    style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>
                <div>
                  <label className="auth-form-label" style={{ fontSize: '0.8rem', marginBottom: 4 }}>שעת יקיצה:</label>
                  <input 
                    type="time" 
                    className="form-input" 
                    value={preWorkoutSleepEnd} 
                    onChange={(e) => setPreWorkoutSleepEnd(e.target.value)} 
                    style={{ padding: '6px 10px', fontSize: '0.85rem', width: '100%' }}
                  />
                </div>
              </div>

              <div className="auth-form-group" style={{ marginBottom: 0 }}>
                <label className="auth-form-label" style={{ marginBottom: 4, fontSize: '0.85rem' }}>רמת אנרגיה כללית:</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setPreWorkoutEnergy(star)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.6rem', color: star <= preWorkoutEnergy ? 'var(--sport-volt)' : '#3a3a3c', padding: 0 }}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowPreWorkoutModal(false);
                    setPreWorkoutTemplate(null);
                  }}
                >
                  ביטול
                </button>
                <button type="submit" className="btn btn-gold">
                  🚀 שמור והתחל אימון
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
