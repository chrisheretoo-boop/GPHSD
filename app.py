from flask import Flask, render_template_string, redirect, url_for
import sqlite3

app = Flask(__name__)
DB_NAME = "tickets.db"

# --- HTML TEMPLATE (Sith Theme) ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sith Holonet | Ticket Console</title>
    <style>
        :root {
            --bg-color: #050505;
            --primary-red: #ff4d4d;
            --dim-red: #4a1a1a;
            --glow: 0 0 10px rgba(255, 77, 77, 0.5), 0 0 20px rgba(255, 77, 77, 0.3);
            --scanline: rgba(255, 255, 255, 0.02);
        }

        body {
            background-color: var(--bg-color);
            color: var(--primary-red);
            font-family: 'Courier New', Courier, monospace;
            margin: 0;
            padding: 40px;
            min-height: 100vh;
            text-transform: uppercase;
            overflow-x: hidden;
        }

        /* Scanline effect */
        body::before {
            content: " ";
            display: block;
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            right: 0;
            background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            z-index: 2;
            background-size: 100% 2px, 3px 100%;
            pointer-events: none;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            position: relative;
            z-index: 10;
            border: 1px solid var(--dim-red);
            padding: 2rem;
            box-shadow: 0 0 30px rgba(255, 0, 0, 0.05);
        }

        header {
            border-bottom: 2px solid var(--primary-red);
            padding-bottom: 1rem;
            margin-bottom: 2rem;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
        }

        h1 {
            font-size: 2.5rem;
            margin: 0;
            letter-spacing: 4px;
            text-shadow: var(--glow);
        }

        .status-badge {
            font-size: 0.8rem;
            border: 1px solid var(--primary-red);
            padding: 5px 10px;
            box-shadow: var(--glow);
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }

        th {
            text-align: left;
            padding: 15px;
            border-bottom: 1px solid var(--primary-red);
            font-size: 0.9rem;
            opacity: 0.8;
            letter-spacing: 2px;
        }

        td {
            padding: 15px;
            border-bottom: 1px solid var(--dim-red);
            font-size: 1rem;
        }

        tr:hover td {
            background-color: rgba(255, 77, 77, 0.05);
        }

        .btn {
            background: transparent;
            color: var(--primary-red);
            border: 1px solid var(--primary-red);
            padding: 8px 16px;
            cursor: pointer;
            font-family: inherit;
            text-transform: uppercase;
            font-weight: bold;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            font-size: 0.8rem;
        }

        .btn:hover {
            background: var(--primary-red);
            color: #000;
            box-shadow: var(--glow);
        }

        .empty-state {
            text-align: center;
            padding: 4rem;
            opacity: 0.5;
            font-style: italic;
        }

        .footer {
            margin-top: 4rem;
            text-align: center;
            font-size: 0.7rem;
            opacity: 0.4;
            letter-spacing: 2px;
        }
    </style>
</head>
<body>

<div class="container">
    <header>
        <h1>Imperial Support</h1>
        <div class="status-badge">System: Online</div>
    </header>

    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>User</th>
                <th>Subject</th>
                <th>Status</th>
                <th style="text-align: right;">Action</th>
            </tr>
        </thead>
        <tbody>
            {% for ticket in tickets %}
            <tr>
                <td>#{{ ticket['id'] }}</td>
                <td>{{ ticket['user'] }}</td>
                <td>{{ ticket['subject'] }}</td>
                <td style="color: #ff8888;">{{ ticket['status'] }}</td>
                <td style="text-align: right;">
                    <a href="{{ url_for('close_ticket', id=ticket['id']) }}" class="btn">Close Ticket</a>
                </td>
            </tr>
            {% else %}
            <tr>
                <td colspan="5" class="empty-state">
                    NO ACTIVE TRANSMISSIONS DETECTED. THE GALAXY IS SILENT.
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>

    <div class="footer">
        AUTHORIZED PERSONNEL ONLY // SITH ETERNAL FLASK v1.0
    </div>
</div>

</body>
</html>
"""

def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database if it doesn't exist, just for the demo to run."""
    try:
        conn = get_db_connection()
        # Create table if it doesn't exist (assuming a simple schema for a Discord bot)
        conn.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user TEXT NOT NULL,
                subject TEXT NOT NULL,
                status TEXT DEFAULT 'open',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Check if empty, populate with dummy data if so
        cur = conn.execute("SELECT count(*) FROM tickets")
        if cur.fetchone()[0] == 0:
            conn.execute("INSERT INTO tickets (user, subject, status) VALUES ('Kylo Ren', 'Helmet Refurbishment', 'open')")
            conn.execute("INSERT INTO tickets (user, subject, status) VALUES ('Gen. Hux', 'Trooper Aim Calibration', 'open')")
            conn.execute("INSERT INTO tickets (user, subject, status) VALUES ('FN-2187', 'Sanitation Duty Appeal', 'closed')")
            conn.execute("INSERT INTO tickets (user, subject, status) VALUES ('Palpatine', 'Electricity Bill Dispute', 'open')")
            print("Database initialized with Sith dummy data.")
        
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Database init error: {e}")

@app.route('/')
def index():
    conn = get_db_connection()
    try:
        # Fetch only 'open' tickets
        tickets = conn.execute("SELECT * FROM tickets WHERE status = 'open'").fetchall()
    except sqlite3.OperationalError:
        # Fallback if table doesn't exist (handled by init_db usually, but safe guard)
        tickets = []
    conn.close()
    return render_template_string(HTML_TEMPLATE, tickets=tickets)

@app.route('/close/<int:id>')
def close_ticket(id):
    conn = get_db_connection()
    conn.execute("UPDATE tickets SET status = 'closed' WHERE id = ?", (id,))
    conn.commit()
    conn.close()
    return redirect(url_for('index'))

if __name__ == '__main__':
    # Initialize DB on start to prevent crashes if file is missing
    init_db()
    print("Starting Sith Dashboard on http://127.0.0.1:5000")
    app.run(debug=True, port=5000)
