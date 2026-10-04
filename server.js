const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error(err.message);
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS schedule (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date_num INTEGER,
        day_str TEXT,
        user_id INTEGER,
        is_done BOOLEAN DEFAULT 0,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Seed initial users if empty
    db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
        if (row.count === 0) {
            const initialUsers = ['Krunal', 'Soumya', 'Paras', 'Jayraj', 'Prikshit'];
            const stmt = db.prepare("INSERT INTO users (name) VALUES (?)");
            initialUsers.forEach(u => stmt.run(u));
            stmt.finalize();

            // Seed initial schedule from PDF
            const initialSchedule = [
                { date: 4, day: 'Saturday', user: 1 },
                { date: 5, day: 'Sunday', user: 2 },
                { date: 6, day: 'Monday', user: 3 },
                { date: 7, day: 'Tuesday', user: 4 },
                { date: 8, day: 'Wednesday', user: 5 },
                { date: 9, day: 'Thursday', user: 1 },
                { date: 10, day: 'Friday', user: 2 },
                { date: 11, day: 'Saturday', user: 3 },
                { date: 12, day: 'Sunday', user: 4 },
                { date: 13, day: 'Monday', user: 5 },
                { date: 14, day: 'Tuesday', user: 1 },
                { date: 15, day: 'Wednesday', user: 2 },
                { date: 16, day: 'Thursday', user: 3 },
                { date: 17, day: 'Friday', user: 4 },
                { date: 18, day: 'Saturday', user: 5 },
                { date: 19, day: 'Sunday', user: 1 },
                { date: 20, day: 'Monday', user: 2 },
                { date: 21, day: 'Tuesday', user: 3 },
                { date: 22, day: 'Wednesday', user: 4 },
                { date: 23, day: 'Thursday', user: 5 },
                { date: 24, day: 'Friday', user: 1 },
                { date: 25, day: 'Saturday', user: 2 },
                { date: 26, day: 'Sunday', user: 3 },
                { date: 27, day: 'Monday', user: 4 },
                { date: 28, day: 'Tuesday', user: 5 },
                { date: 29, day: 'Wednesday', user: 1 },
                { date: 30, day: 'Thursday', user: 2 },
                { date: 31, day: 'Friday', user: 3 }
            ];

            const schedStmt = db.prepare("INSERT INTO schedule (date_num, day_str, user_id, is_done) VALUES (?, ?, ?, 0)");
            initialSchedule.forEach(s => schedStmt.run(s.date, s.day, s.user));
            schedStmt.finalize();
        }
    });
});

// Get schedule
app.get('/api/schedule', (req, res) => {
    db.all(`
        SELECT s.id, s.date_num, s.day_str, s.is_done, u.name as user_name 
        FROM schedule s
        JOIN users u ON s.user_id = u.id
        ORDER BY s.date_num ASC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Toggle status
app.post('/api/schedule/:id/toggle', (req, res) => {
    const id = req.params.id;
    const { is_done } = req.body;
    db.run("UPDATE schedule SET is_done = ? WHERE id = ?", [is_done ? 1 : 0, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, id, is_done });
    });
});

// Get users
app.get('/api/users', (req, res) => {
    db.all("SELECT * FROM users", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Add user
app.post('/api/users', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    db.run("INSERT INTO users (name) VALUES (?)", [name], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ id: this.lastID, name });
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
process.on('exit', (code) => { console.log('About to exit with code: ' + code); });
process.on('uncaughtException', (err) => { console.error('Uncaught Exception:', err); });
