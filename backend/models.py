from datetime import datetime, timezone
from database import db
from sqlalchemy.dialects.postgresql import JSON

class Order(db.Model):
    __tablename__ = 'orders'

    id = db.Column(db.String(100), primary_key=True)  # Order ID (UUID ou format FN...)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default='pending')  # pending, paid, delivered, cancelled
    
    # Données JSON pour stocker la flexibilité des items et clients sans structure rigide
    # En SQLite, JSON est stocké comme TEXT, en Postgres c'est du vrai JSONB
    customer_data = db.Column(db.JSON) 
    items_data = db.Column(db.JSON)
    
    lygos_link = db.Column(db.String(500))
    lygos_ref = db.Column(db.String(100))
    
    # Relation avec utilisateur (Auth)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Relation avec les messages
    messages = db.relationship('Message', backref='order', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        # Fetch last message for preview
        last_msg = None
        msg_count = 0
        
        # Note: messages is a list (eager) or query (lazy) depending on relationship config. 
        # In this hybrid setup without complex migrations, we assume .messages access triggers lazy load.
        # But here 'messages' is defined as lazy=True. So accessing self.messages returns a list.
        # For performance on large sets, this might be slow, but fine for <50 orders.
        
        if self.messages:
            msg_count = len(self.messages)
            # Sort manually if needed, or rely on DB order if sorted there. 
            # Ideally sort by timestamp descending
            sorted_msgs = sorted(self.messages, key=lambda m: m.timestamp, reverse=True)
            if sorted_msgs:
                last_msg = sorted_msgs[0].to_dict()

        return {
            'order_id': self.id,
            'user_id': self.user_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'amount': self.amount,
            'status': self.status,
            'customer_data': self.customer_data,
            'items': self.items_data,
            'lygos_link': self.lygos_link,
            'message_count': msg_count,
            'last_message': last_msg
        }

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=True) # Nullable si Google Auth uniquement
    name = db.Column(db.String(100))
    google_id = db.Column(db.String(100), unique=True, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    # Relation
    orders = db.relationship('Order', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'google_connected': bool(self.google_id)
        }

class Message(db.Model):
    __tablename__ = 'messages'

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.String(100), db.ForeignKey('orders.id'), nullable=False)
    
    sender_type = db.Column(db.String(20), nullable=False)  # 'user' or 'admin'
    content = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    is_read = db.Column(db.Boolean, default=False)

    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'sender': self.sender_type,
            'content': self.content,
            'timestamp': self.timestamp.isoformat(),
            'is_read': self.is_read
        }
