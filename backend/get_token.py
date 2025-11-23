import sqlite3
conn = sqlite3.connect('interview.db')
cursor = conn.cursor()
cursor.execute("SELECT verification_token FROM users WHERE email='test_verify_browser@example.com'")
result = cursor.fetchone()
if result:
    print(result[0])
else:
    print("User not found")
