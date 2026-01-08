
import os
import psycopg2
from urllib.parse import urlparse
import sys

# Tenter de charger .env si local
try:
    from dotenv import load_dotenv
    load_dotenv('backend/.env')
    print("✅ .env loaded")
except ImportError:
    pass

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    print("❌ Erreur: DATABASE_URL non définie.")
    print("Assurez-vous que la variable d'environnement est définie ou passez-la manuellement.")
    sys.exit(1)

# Fix pour SQLAlchemy old style, mais ici on utilise psycopg2 direct
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

def run_migration():
    print(f"🔌 Connexion à la base de données...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("🛠️ Vérification et ajout de la colonne 'user_id'...")
        
        # 1. Ajouter la colone user_id si elle n'existe pas
        alter_query = """
        ALTER TABLE orders 
        ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id);
        """
        
        cur.execute(alter_query)
        print("✅ Colonne 'user_id' ajoutée (ou déjà présente).")

        cur.close()
        conn.close()
        print("🎉 Migration terminée avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {e}")

if __name__ == "__main__":
    run_migration()
