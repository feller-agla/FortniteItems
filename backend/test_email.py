#!/usr/bin/env python3
"""
Script de test pour vérifier la configuration email
Usage: python3 test_email.py
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Configuration (charger depuis .env si disponible)
ADMIN_EMAIL = "contact.fortniteitems@gmail.com"
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def test_email():
    """Envoie un email de test"""
    
    print("=" * 60)
    print("🧪 TEST EMAIL - FortniteItems")
    print("=" * 60)
    
    # Vérifier la configuration
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print("❌ ERREUR: Variables d'environnement manquantes")
        print("\nConfigurer dans .env:")
        print("  SMTP_EMAIL=votre-email@gmail.com")
        print("  SMTP_PASSWORD=votre-mot-de-passe-app")
        print("\n📖 Voir GUIDE_EMAIL_CONFIG.md pour la configuration complète")
        return False
    
    print(f"\n📧 Email expéditeur: {SMTP_EMAIL}")
    print(f"📬 Email destinataire: {ADMIN_EMAIL}")
    print(f"🌐 Serveur SMTP: {SMTP_SERVER}:{SMTP_PORT}")
    
    # Créer un email de test
    subject = f"🧪 TEST FortniteItems - {datetime.now().strftime('%H:%M:%S')}"
    
    html_content = f"""
    <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; }}
                .success-box {{ background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🧪 Test Email Réussi !</h1>
            </div>
            <div class="content">
                <div class="success-box">
                    <h3>✅ Configuration Email Fonctionnelle</h3>
                    <p>Ce message confirme que votre configuration SMTP Gmail fonctionne correctement.</p>
                    <p><strong>Timestamp:</strong> {datetime.now().isoformat()}</p>
                </div>
                <h3>📝 Prochaines Étapes</h3>
                <ul>
                    <li>✅ La configuration email est opérationnelle</li>
                    <li>🔜 Les notifications de commande seront envoyées automatiquement</li>
                    <li>📧 Vérifiez votre boîte de réception principale</li>
                    <li>🗂️ Si vous ne voyez pas cet email, vérifiez les spams</li>
                </ul>
                <p style="margin-top: 30px; color: #666; font-size: 12px;">
                    Email automatique - FortniteItems Backend<br>
                    Support WhatsApp: +229 65 62 36 91
                </p>
            </div>
        </body>
    </html>
    """
    
    try:
        print("\n⏳ Connexion au serveur SMTP...")
        
        # Créer le message
        msg = MIMEMultipart('alternative')
        msg['From'] = SMTP_EMAIL
        msg['To'] = ADMIN_EMAIL
        msg['Subject'] = subject
        
        # Ajouter le contenu HTML
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        # Envoyer l'email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            print("🔐 Authentification...")
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            print("📤 Envoi de l'email...")
            server.send_message(msg)
        
        print("\n" + "=" * 60)
        print("✅ EMAIL ENVOYÉ AVEC SUCCÈS !")
        print("=" * 60)
        print(f"\n📬 Vérifiez votre boîte email: {ADMIN_EMAIL}")
        print("🔍 Si vous ne le voyez pas, vérifiez:")
        print("   - Dossier Inbox")
        print("   - Dossier Spam/Courrier indésirable")
        print("   - Dossier Promotions (Gmail)")
        print("\n✨ Configuration email fonctionnelle ! Prêt pour la production.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR D'AUTHENTIFICATION")
        print("=" * 60)
        print("\n🔑 Vérifiez:")
        print("   1. Vous utilisez un MOT DE PASSE D'APPLICATION (pas votre mot de passe Gmail)")
        print("   2. La validation en 2 étapes est activée sur Gmail")
        print("   3. Le mot de passe ne contient pas d'espaces")
        print("\n📖 Consultez GUIDE_EMAIL_CONFIG.md pour les instructions complètes")
        print(f"\nDétails: {str(e)}")
        return False
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("❌ ERREUR LORS DE L'ENVOI")
        print("=" * 60)
        print(f"\nDétails: {str(e)}")
        print(f"Type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    # Charger les variables d'environnement depuis .env si disponible
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("📁 Fichier .env chargé")
    except ImportError:
        print("⚠️  python-dotenv non installé (optionnel)")
        print("   Installer: pip install python-dotenv")
    
    success = test_email()
    exit(0 if success else 1)
