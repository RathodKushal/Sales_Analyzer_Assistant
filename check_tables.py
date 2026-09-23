import sqlite3
conn = sqlite3.connect('sales_analyzer.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("TABLES:", [t[0] for t in tables])
conn.close()
