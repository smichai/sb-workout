import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'db.json');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());

// Helper functions to read/write JSON db file
const readDB = () => {
  try {
    if (!fs.existsSync(DB_FILE)) {
      // If it doesn't exist, create it with default skeleton
      const initialData = { users: [], workouts: [], logs: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return { users: [], workouts: [], logs: [] };
  }
};

const writeDB = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing to database:', error);
  }
};

// --- AUTH ROUTES ---
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'נא להזין שם משתמש וסיסמה' });
  }

  const db = readDB();
  const user = db.users.find(
    (u) => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/auth/google', (req, res) => {
  const { email, name, picture } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'אימייל ושם נדרשים להתחברות עם גוגל' });
  }

  const db = readDB();
  let user = db.users.find(u => u.username.toLowerCase() === email.toLowerCase());

  if (!user) {
    // Register new user with Google details
    user = {
      username: email.toLowerCase(),
      name: name,
      email: email.toLowerCase(),
      picture: picture || null,
      role: 'מתאמן',
      password: ''
    };
    db.users.push(user);

    // Create default templates for the new user
    const defaultTemplates = [
      {
        id: 'default-push-' + Date.now(),
        name: 'אימון לחיצה (Push) - חזה וכתפיים',
        createdBy: email.toLowerCase(),
        exercises: [
          { name: 'לחיצת חזה עם מוט (Bench Press)', sets: 3, reps: '10', weight: 60, restTime: 90 },
          { name: 'לחיצת כתפיים עם משקולות (Shoulder Press)', sets: 3, reps: '10', weight: 15, restTime: 75 },
          { name: 'הרחקת כתפיים לצדדים (Lateral Raises)', sets: 3, reps: '12', weight: 10, restTime: 60 }
        ]
      },
      {
        id: 'default-pull-' + Date.now(),
        name: 'אימון משיכה (Pull) - גב וידיים',
        createdBy: email.toLowerCase(),
        exercises: [
          { name: 'מתח באחיזה רחבה (Pull-ups)', sets: 3, reps: '8', weight: 0, restTime: 90 },
          { name: 'חתירה עם מוט (Barbell Row)', sets: 3, reps: '10', weight: 50, restTime: 75 },
          { name: 'כפיפת מרפקים עם משקולות (Dumbbell Curl)', sets: 3, reps: '12', weight: 12.5, restTime: 60 }
        ]
      }
    ];

    db.workouts = [...db.workouts, ...defaultTemplates];
    writeDB(db);
  } else {
    // Update name/picture if changed
    let updated = false;
    if (name && user.name !== name) {
      user.name = name;
      updated = true;
    }
    if (picture && user.picture !== picture) {
      user.picture = picture;
      updated = true;
    }
    if (updated) {
      writeDB(db);
    }
  }

  res.json(user);
});

// --- USER ROUTES (Profiles and Stats) ---
app.get('/api/users', (req, res) => {
  const db = readDB();
  const usersWithStats = db.users.map((u) => {
    const userLogs = db.logs.filter((log) => log.completedBy === u.username);
    const lastWorkout = userLogs.length > 0
      ? userLogs.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]
      : null;
    
    return {
      username: u.username,
      name: u.name,
      role: u.role,
      workoutCount: userLogs.length,
      lastWorkoutDate: lastWorkout ? lastWorkout.completedAt : null,
    };
  });
  res.json(usersWithStats);
});

// Update profile name
app.post('/api/users/profile', (req, res) => {
  const { username, name } = req.body;
  if (!username || !name) {
    return res.status(400).json({ error: 'שם משתמש ושם תצוגה נדרשים' });
  }

  const db = readDB();
  const userIndex = db.users.findIndex((u) => u.username === username);
  if (userIndex === -1) {
    return res.status(404).json({ error: 'משתמש לא נמצא' });
  }

  db.users[userIndex].name = name;
  writeDB(db);
  res.json({ username, name, role: db.users[userIndex].role });
});

// --- WORKOUT TEMPLATE ROUTES ---
app.get('/api/workouts', (req, res) => {
  const db = readDB();
  res.json(db.workouts || []);
});

app.post('/api/workouts', (req, res) => {
  const { id, name, type, createdBy, exercises } = req.body;
  if (!name || !createdBy || !exercises || !Array.isArray(exercises)) {
    return res.status(400).json({ error: 'נתוני אימון חסרים או לא תקינים' });
  }

  const db = readDB();
  
  if (id) {
    const index = db.workouts.findIndex((w) => w.id === id);
    if (index !== -1) {
      db.workouts[index] = {
        ...db.workouts[index],
        name,
        type: type || 'workout',
        exercises: exercises.map((e, index) => ({
          id: e.id || `e_${Date.now()}_${index}`,
          name: e.name,
          type: e.type || 'workout',
          isSuperset: !!e.isSuperset,
          subExercises: e.subExercises || [],
          sets: parseInt(e.sets) || 3,
          reps: String(e.reps) || '10',
          weight: parseFloat(e.weight) || 0,
          restTime: parseInt(e.restTime) || 60,
          setsDetail: e.setsDetail || []
        }))
      };
      writeDB(db);
      return res.json(db.workouts[index]);
    }
  }

  const newWorkout = {
    id: id || `w_${Date.now()}`,
    name,
    type: type || 'workout',
    createdBy,
    createdAt: new Date().toISOString(),
    exercises: exercises.map((e, index) => ({
      id: e.id || `e_${Date.now()}_${index}`,
      name: e.name,
      type: e.type || 'workout',
      isSuperset: !!e.isSuperset,
      subExercises: e.subExercises || [],
      sets: parseInt(e.sets) || 3,
      reps: String(e.reps) || '10',
      weight: parseFloat(e.weight) || 0,
      restTime: parseInt(e.restTime) || 60,
      setsDetail: e.setsDetail || []
    })),
  };

  db.workouts.push(newWorkout);
  writeDB(db);
  res.status(201).json(newWorkout);
});

app.delete('/api/workouts/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.workouts.findIndex((w) => w.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'האימון לא נמצא' });
  }

  db.workouts.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'האימון נמחק בהצלחה' });
});

// --- WORKOUT LOG ROUTES (History) ---
app.get('/api/logs', (req, res) => {
  const db = readDB();
  res.json(db.logs || []);
});

app.post('/api/logs', (req, res) => {
  const { workoutId, name, completedBy, duration, exercises } = req.body;
  if (!name || !completedBy || !exercises || !Array.isArray(exercises)) {
    return res.status(400).json({ error: 'נתוני יומן אימון חסרים' });
  }

  const db = readDB();
  const newLog = {
    id: `log_${Date.now()}`,
    workoutId: workoutId || null,
    name,
    completedBy,
    completedAt: new Date().toISOString(),
    duration: parseInt(duration) || 0, // in seconds
    exercises: exercises.map((e) => ({
      name: e.name,
      isSuperset: !!e.isSuperset,
      subExercises: e.subExercises || [],
      sets: e.sets.map((s) => ({
        setNumber: parseInt(s.setNumber),
        reps: parseInt(s.reps) || 0,
        weight: parseFloat(s.weight) || 0,
        completed: s.completed !== false,
        subResults: s.subResults || []
      })),
    })),
  };

  db.logs.push(newLog);
  writeDB(db);
  res.status(201).json(newLog);
});

app.delete('/api/logs/:id', (req, res) => {
  const { id } = req.params;
  const db = readDB();
  const index = db.logs.findIndex((l) => l.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'תיעוד האימון לא נמצא' });
  }

  db.logs.splice(index, 1);
  writeDB(db);
  res.json({ success: true, message: 'תיעוד האימון נמחק בהצלחה' });
});

// --- USER STATS / METRICS ROUTES ---
app.get('/api/stats', (req, res) => {
  const db = readDB();
  res.json(db.stats || []);
});

app.post('/api/stats', (req, res) => {
  const { username, weight, bodyFat, sleepQuality, energyLevel, hebrewDate, sleepStart, sleepEnd } = req.body;
  if (!username || !weight) {
    return res.status(400).json({ error: 'נתוני משקל גוף חסרים' });
  }

  const db = readDB();
  if (!db.stats) {
    db.stats = [];
  }

  const newStat = {
    id: `stat_${Date.now()}`,
    username,
    date: req.body.date || new Date().toISOString(),
    hebrewDate: hebrewDate || '',
    weight: parseFloat(weight),
    bodyFat: bodyFat ? parseFloat(bodyFat) : null,
    sleepQuality: sleepQuality ? parseInt(sleepQuality) : null,
    energyLevel: energyLevel ? parseInt(energyLevel) : null,
    sleepStart: sleepStart || '',
    sleepEnd: sleepEnd || ''
  };

  db.stats.push(newStat);
  writeDB(db);
  res.status(201).json(newStat);
});

// Serve Vite build output in production
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res, filepath) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }));
  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
