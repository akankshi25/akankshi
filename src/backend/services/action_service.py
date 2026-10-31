"""
Questify AI - Action Execution & Approval Service
Coordinates the strict 12-step execution lifecycle:
Preview -> Explicit User Approval -> Source Execution -> Independent Verification -> Idempotent XP -> History
"""
import uuid
import json
from typing import List, Dict, Any, Optional
from backend.database import get_db
from backend.schemas import (
    ActionPreviewRequest, ActionRecordSchema, ActionBatchResult
)
from backend.services.verification_service import (
    verify_trash_operation, verify_organisation_operation,
    verify_protection_operation, verify_verdict_operation
)
from backend.services.reward_service import award_xp_idempotent
from backend.services.mission_service import advance_mission_progress

XP_RATES = {
    "move_to_trash": 10,
    "organise_chest": 10,
    "protect_item": 10,
    "submit_verdict": 15,
}

GAME_MAPPING = {
    "move_to_trash": "ocean_explorer",
    "organise_chest": "lost_kingdom",
    "protect_item": "guardian_realm",
    "submit_verdict": "scam_detective",
}

def preview_actions(user_id: str, req: ActionPreviewRequest) -> List[ActionRecordSchema]:
    """
    Step 14-15:
    Creates proposed action records awaiting user's explicit interactive approval in game.
    """
    records = []
    with get_db() as conn:
        cursor = conn.cursor()
        for item_id in req.item_ids:
            cursor.execute("SELECT id, source, title, is_protected FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
            item = cursor.fetchone()
            if not item:
                continue
                
            # Extra safeguard: if protected item is targeted for deletion, flag details
            details = {
                "title": item["title"],
                "target_destination": req.target_destination,
                "verdict": req.verdict,
                "notes": req.notes,
                "is_protected": bool(item["is_protected"])
            }
            
            action_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO action_records (
                    id, user_id, item_id, action_type, source, status, target_destination, details
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                action_id, user_id, item_id, req.action_type, item["source"],
                "awaiting_approval", req.target_destination, json.dumps(details)
            ))
            
            records.append(ActionRecordSchema(
                id=action_id,
                item_id=item_id,
                action_type=req.action_type,
                source=item["source"],
                status="awaiting_approval",
                target_destination=req.target_destination,
                details=details
            ))
    return records

def approve_and_execute_actions(user_id: str, action_ids: List[str]) -> ActionBatchResult:
    """
    Step 16-19:
    User has explicitly approved proposed actions.
    Backend executes permitted operation, verifies it, awards XP only on verified success.
    """
    verified_records = []
    failed_count = 0
    total_xp = 0
    last_level = 1
    last_title = ""
    any_level_up = False

    with get_db() as conn:
        cursor = conn.cursor()
        
        for action_id in action_ids:
            cursor.execute("""
                SELECT id, user_id, item_id, action_type, source, status, target_destination, details
                FROM action_records
                WHERE id = ? AND user_id = ?
            """, (action_id, user_id))
            action = cursor.fetchone()
            if not action:
                continue
                
            # Prevent duplicate execution
            if action["status"] in ["verified", "executing"]:
                continue
                
            item_id = action["item_id"]
            action_type = action["action_type"]
            source = action["source"]
            target_dest = action["target_destination"]
            details = json.loads(action["details"]) if action["details"] else {}

            cursor.execute("UPDATE action_records SET status = 'executing', approved_at = CURRENT_TIMESTAMP WHERE id = ?", (action_id,))
            
            execution_succeeded = True
            error_reason = None
            
            # --- 1. Execute Operation ---
            try:
                if action_type == "move_to_trash":
                    # Source execution: mark in trash
                    cursor.execute("UPDATE digital_items SET is_in_trash = 1 WHERE id = ?", (item_id,))
                    trash_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT INTO trash_records (id, user_id, item_id, source, original_location)
                        VALUES (?, ?, ?, ?, ?)
                    """, (trash_id, user_id, item_id, source, details.get("original_location", "INBOX")))
                    
                elif action_type == "organise_chest":
                    # Source execution: assign folder or label
                    cursor.execute("UPDATE digital_items SET current_location = ? WHERE id = ?", (target_dest, item_id))
                    
                elif action_type == "protect_item":
                    # Source execution: set protected flag & record in protected_items
                    cursor.execute("UPDATE digital_items SET is_protected = 1 WHERE id = ?", (item_id,))
                    prot_id = str(uuid.uuid4())
                    cursor.execute("""
                        INSERT OR REPLACE INTO protected_items (id, user_id, item_id, protection_type, notes)
                        VALUES (?, ?, ?, ?, ?)
                    """, (prot_id, user_id, item_id, "guardian_shield", details.get("notes", "User approved protection in Guardian Realm"))
                    )
                    
                elif action_type == "submit_verdict":
                    # Source execution: record investigation case verdict
                    case_id = str(uuid.uuid4())
                    verdict = details.get("verdict", "unverified")
                    cursor.execute("""
                        INSERT OR REPLACE INTO investigation_cases (id, user_id, item_id, clues_json, final_verdict, user_notes, resolved_at)
                        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    """, (case_id, user_id, item_id, json.dumps(details), verdict, details.get("notes", "")))
                else:
                    execution_succeeded = False
                    error_reason = f"Unknown action type: {action_type}"
            except Exception as e:
                execution_succeeded = False
                error_reason = str(e)
                
            # Commit execution changes so independent verification can inspect the committed state
            if execution_succeeded:
                conn.commit()

            # --- 2. Independent Verification ---
            is_verified = False
            if execution_succeeded:
                if action_type == "move_to_trash":
                    is_verified, error_reason = verify_trash_operation(item_id, user_id)
                elif action_type == "organise_chest":
                    is_verified, error_reason = verify_organisation_operation(item_id, user_id, target_dest)
                elif action_type == "protect_item":
                    is_verified, error_reason = verify_protection_operation(item_id, user_id)
                elif action_type == "submit_verdict":
                    is_verified, error_reason = verify_verdict_operation(item_id, user_id, details.get("verdict", "unverified"))
            
            # --- 3. Handle Verification Outcome ---
            if is_verified:
                cursor.execute("""
                    UPDATE action_records 
                    SET status = 'verified', executed_at = CURRENT_TIMESTAMP, verified_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (action_id,))
                
                # Award XP
                base_xp = XP_RATES.get(action_type, 10)
                xp_awarded, lvl_up, last_level, last_title = award_xp_idempotent(
                    user_id=user_id,
                    xp_amount=base_xp,
                    reason=f"Verified action: {action_type.replace('_', ' ').title()}",
                    idempotency_key=f"action_{action_id}_xp",
                    action_id=action_id,
                    conn=conn
                )
                total_xp += xp_awarded
                if lvl_up:
                    any_level_up = True
                    
                # Advance Game World Mission
                game_name = GAME_MAPPING.get(action_type, "ocean_explorer")
                advance_mission_progress(user_id, game_name, increment=1, conn=conn)
                
                # Log Activity History
                event_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO activity_history (id, user_id, item_id, event_type, description, details)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (
                    event_id, user_id, item_id, f"ACTION_{action_type.upper()}",
                    f"Successfully executed and verified '{action_type}' on '{details.get('title', item_id)}'",
                    json.dumps({"action_id": action_id, "verified": True, "xp_awarded": xp_awarded})
                ))
                
                verified_records.append(ActionRecordSchema(
                    id=action_id,
                    item_id=item_id,
                    action_type=action_type,
                    source=source,
                    status="verified",
                    target_destination=target_dest,
                    details=details,
                    verified_at="Just now"
                ))
            else:
                failed_count += 1
                cursor.execute("""
                    UPDATE action_records 
                    SET status = 'failed', error_message = ?
                    WHERE id = ?
                """, (error_reason or "Verification check failed.", action_id))

    return ActionBatchResult(
        success=(failed_count == 0),
        verified_count=len(verified_records),
        failed_count=failed_count,
        xp_awarded=total_xp,
        level_up=any_level_up,
        new_level=last_level,
        new_level_title=last_title,
        records=verified_records
    )
