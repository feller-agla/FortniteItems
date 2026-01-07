import sqlite3
import os

# Connect to database
db_path = 'items.db'
if not os.path.exists(db_path):
    print(f"❌ Base de données introuvable à : {db_path}")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

def print_table(table_name):
    print(f"\n📋 TABLE: {table_name}")
    print("-" * 50)
    try:
        cursor.execute(f"SELECT * FROM {table_name}")
        rows = cursor.fetchall()
        
        # Get column names
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = [col[1] for col in cursor.fetchall()]
        print(" | ".join(columns))
        print("-" * 50)
        
        if not rows:
            print("(Aucune donnée)")
        
        for row in rows:
            print(row)
            
    except Exception as e:
        print(f"Erreur: {e}")

# List orders and messages
print(f"📂 Base de données: {os.path.abspath(db_path)}")
print_table('orders')
print_table('messages')

conn.close()
