import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def init_db(app):
    """
    Initialise la connexion à la base de données.
    Utilise DATABASE_URL si disponible (Render PostgreSQL),
    sinon utilise SQLite local items.db
    """
    database_url = os.getenv('DATABASE_URL')
    
    if database_url:
        # Fix pour les URLs Postgres commençant par postgres:// (Obsolète dans SQLAlchemy)
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
    else:
        # Fallback local SQLite
        base_dir = os.path.abspath(os.path.dirname(__file__))
        database_url = f"sqlite:///{os.path.join(base_dir, 'items.db')}"
        print("⚠️  DATABASE_URL non défini: Utilisation de SQLite local (items.db)")

    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)
    
    with app.app_context():
        # Créer les tables si elles n'existent pas
        db.create_all()
        print("✅ Base de données initialisée")
