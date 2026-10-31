"""
Questify AI - Mission Service
Manages daily, weekly, and epic quests across all 4 game worlds.
Advances progress only upon verified actions.
"""
import uuid
import json
from typing import List
from backend.database import get_db
from backend.schemas import MissionSchema
from backend.services.reward_service import award_xp_idempotent

def get_user_missions(user_id: str) -> List[MissionSchema]:
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, code, title, description, game, xp_reward, target_count, current_count, status, mission_type
            FROM missions
            WHERE user_id = ?
            ORDER BY status ASC, mission_type DESC
        """, (user_id,))
        return [
            MissionSchema(
                id=r["id"],
                code=r["code"],
                title=r["title"],
                description=r["description"],
                game=r["game"],
                xp_reward=r["xp_reward"],
                target_count=r["target_count"],
                current_count=r["current_count"],
                status=r["status"],
                mission_type=r["mission_type"]
            ) for r in cursor.fetchall()
        ]

def advance_mission_progress(user_id: str, game: str, increment: int = 1, conn = None) -> None:
    """
    Increments progress on relevant active missions for the game.
    If target reached, marks completed and awards bonus mission XP.
    """
    def _execute(connection):
        cursor = connection.cursor()
        cursor.execute("""
            SELECT id, code, title, xp_reward, target_count, current_count, status
            FROM missions
            WHERE user_id = ? AND game = ? AND status = 'in_progress'
        """, (user_id, game))
        active_missions = cursor.fetchall()
        
        for m in active_missions:
            new_count = m["current_count"] + increment
            if new_count >= m["target_count"]:
                # Complete mission!
                cursor.execute("""
                    UPDATE missions 
                    SET current_count = ?, status = 'completed'
                    WHERE id = ?
                """, (m["target_count"], m["id"]))
                
                # Award mission bonus XP
                award_xp_idempotent(
                    user_id=user_id,
                    xp_amount=m["xp_reward"],
                    reason=f"Mission Completed: {m['title']}",
                    idempotency_key=f"mission_{m['id']}_completed",
                    mission_id=m["id"],
                    conn=connection
                )
                
                # Log completion
                event_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO activity_history (id, user_id, event_type, description, details)
                    VALUES (?, ?, ?, ?, ?)
                """, (event_id, user_id, "MISSION_COMPLETED", f"Completed mission: {m['title']}", json.dumps({"mission_id": m["id"], "reward_xp": m["xp_reward"]})))
            else:
                cursor.execute("""
                    UPDATE missions 
                    SET current_count = ?
                    WHERE id = ?
                """, (new_count, m["id"]))

    if conn is not None:
        _execute(conn)
    else:
        with get_db() as c:
            _execute(c)
