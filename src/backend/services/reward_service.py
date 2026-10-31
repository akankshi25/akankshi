"""
Questify AI - Shared XP, Level Progression, and Rewards Service
Implements the idempotent XP reward ledger, level thresholds, and achievement unlocking.
"""
import uuid
import json
from typing import Tuple, List, Optional
from backend.database import get_db
from backend.services.auth_service import get_level_info
from backend.schemas import AchievementSchema, RewardsSummaryResponse

def award_xp_idempotent(
    user_id: str, 
    xp_amount: int, 
    reason: str, 
    idempotency_key: str, 
    action_id: Optional[str] = None, 
    mission_id: Optional[str] = None,
    conn = None
) -> Tuple[int, bool, int, str]:
    """
    Awards XP safely.
    Guarantees no duplicate XP via the UNIQUE(idempotency_key) constraint in xp_transactions.
    Returns: (xp_awarded, level_up, current_level, current_level_title)
    """
    def _execute(connection):
        cursor = connection.cursor()
        
        # Check idempotency
        cursor.execute("SELECT id FROM xp_transactions WHERE idempotency_key = ?", (idempotency_key,))
        if cursor.fetchone():
            cursor.execute("SELECT xp, level, level_title FROM users WHERE id = ?", (user_id,))
            u = cursor.fetchone()
            return 0, False, u["level"], u["level_title"]
            
        # Insert transaction record
        tx_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO xp_transactions (id, user_id, action_id, mission_id, xp_amount, reason, idempotency_key)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (tx_id, user_id, action_id, mission_id, xp_amount, reason, idempotency_key))
        
        # Get current user state
        cursor.execute("SELECT xp, level FROM users WHERE id = ?", (user_id,))
        curr = cursor.fetchone()
        old_xp = curr["xp"]
        old_lvl = curr["level"]
        
        new_xp = old_xp + xp_amount
        new_lvl, new_title, _, _ = get_level_info(new_xp)
        is_level_up = new_lvl > old_lvl
        
        cursor.execute("""
            UPDATE users 
            SET xp = ?, level = ?, level_title = ?
            WHERE id = ?
        """, (new_xp, new_lvl, new_title, user_id))
        
        # Record XP event in activity history
        event_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, event_type, description, details)
            VALUES (?, ?, ?, ?, ?)
        """, (event_id, user_id, "XP_EARNED", f"Earned +{xp_amount} XP: {reason}", json.dumps({"xp": xp_amount, "new_total": new_xp, "idempotency_key": idempotency_key})))
        
        # Check and trigger achievements
        check_and_unlock_achievements(connection, user_id)
        
        return xp_amount, is_level_up, new_lvl, new_title

    if conn is not None:
        return _execute(conn)
    else:
        with get_db() as c:
            return _execute(c)

def check_and_unlock_achievements(conn, user_id: str) -> None:
    """Checks milestones and unlocks badges if requirements are met."""
    cursor = conn.cursor()
    
    # 1. Ocean Saver: Cleaned items in trash
    cursor.execute("SELECT COUNT(*) as c FROM trash_records WHERE user_id = ?", (user_id,))
    if cursor.fetchone()["c"] >= 1:
        unlock_achievement_internal(conn, user_id, "OCEAN_SAVER", "Ocean Saver", "Defeated your first clutter monster shark and moved digital junk to Central Trash.", "🌊")

    # 2. Treasure Hunter: Organised items
    cursor.execute("SELECT COUNT(*) as c FROM action_records WHERE user_id = ? AND action_type = 'organise_chest' AND status = 'verified'", (user_id,))
    if cursor.fetchone()["c"] >= 1:
        unlock_achievement_internal(conn, user_id, "TREASURE_HUNTER", "Treasure Hunter", "Successfully classified and placed important documents into Kingdom Chests.", "🗝️")

    # 3. Guardian of Memories: Protected items
    cursor.execute("SELECT COUNT(*) as c FROM protected_items WHERE user_id = ?", (user_id,))
    if cursor.fetchone()["c"] >= 1:
        unlock_achievement_internal(conn, user_id, "GUARDIAN_OF_MEMORIES", "Guardian of Memories", "Shielded high-value family and academic files with Guardian wards.", "🛡️")

    # 4. Scam Investigator: Investigations closed
    cursor.execute("SELECT COUNT(*) as c FROM investigation_cases WHERE user_id = ? AND final_verdict IS NOT NULL", (user_id,))
    if cursor.fetchone()["c"] >= 1:
        unlock_achievement_internal(conn, user_id, "SCAM_INVESTIGATOR", "Scam Investigator", "Inspected phishing evidence and rendered an astute detective verdict.", "🔍")

def unlock_achievement_internal(conn, user_id: str, code: str, title: str, description: str, icon: str):
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM achievements WHERE user_id = ? AND code = ?", (user_id, code))
    if not cursor.fetchone():
        ach_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO achievements (id, user_id, code, title, description, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (ach_id, user_id, code, title, description, icon))
        
        # Award 25 bonus XP for unlocking an achievement!
        award_xp_idempotent(user_id, 25, f"Achievement Unlocked: {title}", f"achievement_{code}_{user_id}", conn=conn)
        
        # Log to activity history
        event_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, event_type, description, details)
            VALUES (?, ?, ?, ?, ?)
        """, (event_id, user_id, "ACHIEVEMENT_UNLOCKED", f"Unlocked badge: {icon} {title}!", json.dumps({"code": code, "title": title})))

def get_user_rewards_summary(user_id: str) -> RewardsSummaryResponse:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT xp, level, level_title FROM users WHERE id = ?", (user_id,))
        u = cursor.fetchone()
        xp = u["xp"]
        lvl, title, next_xp, pct = get_level_info(xp)
        
        cursor.execute("SELECT COUNT(*) as c FROM trash_records WHERE user_id = ?", (user_id,))
        cleaned = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM action_records WHERE user_id = ? AND action_type = 'organise_chest' AND status = 'verified'", (user_id,))
        org = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM protected_items WHERE user_id = ?", (user_id,))
        prot = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM investigation_cases WHERE user_id = ? AND final_verdict IS NOT NULL", (user_id,))
        inv = cursor.fetchone()["c"]
        
        cursor.execute("SELECT id, code, title, description, icon, unlocked_at FROM achievements WHERE user_id = ?", (user_id,))
        achs = [
            AchievementSchema(
                id=r["id"],
                code=r["code"],
                title=r["title"],
                description=r["description"],
                icon=r["icon"],
                unlocked_at=str(r["unlocked_at"])
            ) for r in cursor.fetchall()
        ]
        
        return RewardsSummaryResponse(
            xp=xp,
            level=lvl,
            level_title=title,
            xp_for_next_level=next_xp,
            progress_percentage=pct,
            total_cleaned=cleaned,
            total_organised=org,
            total_protected=prot,
            total_investigated=inv,
            achievements=achs
        )
