from flask import Flask, render_template
import psycopg2
import os

app = Flask(__name__)
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "sharedappdb")
DB_USER = os.getenv("DB_USER", "devops")
DB_PASS = os.getenv("DB_PASS", "password")

def get_data():
    conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
    cur = conn.cursor()
    cur.execute("SELECT name FROM devs")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [row[0] for row in rows]

@app.route("/")
def home():
    data = get_data()
    return render_template("index.html", data=data)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
