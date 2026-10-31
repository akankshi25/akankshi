"""
Questify AI - Authentication & User Profile Service
"""
import hashlib
import uuid
import secrets
from typing import Optional, Tuple
from backend.database import get_db
from backend.schemas import UserResponse, UserRegister, UserLogin
from backend.seed_data import DEMO_MISSIONS, INITIAL_ACHIEVEMENTS

# Level configurations
LEVELS = [
    (1, "Beginner Explorer", 0, 100),
    (2, "Digital Adventurer", 100, 250),
    (3, "Realm Protector", 250, 500),
    (4, "Master Organiser", 500, 900),
    (5, "Questify Guardian", 900, 1500),
    (6, "Digital Legend", 1500, 999999),
]

def hash_password(password: str) -> str:
    """Secure SHA-256 password hash with salt."""
    salt = "questify_salt_2026"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def get_level_info(xp: int) -> Tuple[int, str, int, float]:
    """Computes level, title, XP needed for next level, and progress percentage."""
    for lvl, title, min_xp, max_xp in LEVELS:
        if xp < max_xp or lvl == 6:
            range_span = max_xp - min_xp
            current_in_level = xp - min_xp
            pct = min(100.0, max(0.0, (current_in_level / range_span) * 100)) if range_span > 0 else 100.0
            return lvl, title, max_xp, round(pct, 1)
    return 6, "Digital Legend", 999999, 100.0

def create_user_profile(register_data: UserRegister) -> UserResponse:
    user_id = str(uuid.uuid4())
    pw_hash = hash_password(register_data.password)
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (register_data.email.lower().strip(),))
        if cursor.fetchone():
            raise ValueError("An account with this email address already exists.")
        
        cursor.execute("""
            INSERT INTO users (id, email, password_hash, full_name, avatar, xp, level, level_title)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (user_id, register_data.email.lower().strip(), pw_hash, register_data.full_name, "🧙‍♂️", 0, 1, "Beginner Explorer"))
        
        # Initialize default missions for new user
        for m in DEMO_MISSIONS:
            m_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO missions (id, user_id, code, title, description, game, xp_reward, target_count, current_count, status, mission_type)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (m_id, user_id, m["code"], m["title"], m["description"], m["game"], m["xp_reward"], m["target_count"], 0, "in_progress", m["mission_type"]))
            
        # Initialize connections in disconnected state
        for src in ["gmail", "drive", "messages"]:
            conn_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO connections (id, user_id, source, status, is_demo)
                VALUES (?, ?, ?, ?, ?)
            """, (conn_id, user_id, src, "not_connected", 0))

    return get_user_by_id(user_id)

def authenticate_user(login_data: UserLogin) -> Optional[UserResponse]:
    pw_hash = hash_password(login_data.password)
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ? AND password_hash = ?", (login_data.email.lower().strip(), pw_hash))
        row = cursor.fetchone()
        if not row:
            return None
        return get_user_by_id(row["id"])

def get_user_by_id(user_id: str) -> Optional[UserResponse]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, full_name, avatar, xp, level, level_title, created_at FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        if not row:
            return None
        lvl, title, _, _ = get_level_info(row["xp"])
        return UserResponse(
            id=row["id"],
            email=row["email"],
            full_name=row["full_name"],
            avatar=row["avatar"] or "🧙‍♂️",
            xp=row["xp"],
            level=lvl,
            level_title=title,
            created_at=str(row["created_at"])
        )

def get_or_create_demo_user() -> UserResponse:
    """Ensures a standard demo user exists and preloads their environment."""
    demo_email = "demo@questify.ai"
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM users WHERE email = ?", (demo_email,))
        row = cursor.fetchone()
        if row:
            return get_user_by_id(row["id"])
            
    # Create demo user
    reg = UserRegister(
        full_name="Explorer Alex (Demo)",
        email=demo_email,
        password="demopassword123"
    )
    user = create_user_profile(reg)
    
    # Mark connections as demo-connected
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE connections 
            SET status = 'connected', is_demo = 1, account_email = 'alex.demo@questify.ai', last_synced = CURRENT_TIMESTAMP
            WHERE user_id = ?
        """, (user.id,))
        
    return user
