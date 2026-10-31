"""
Questify AI - Central Trash & Recovery Service
Manages Central Trash, item restoration to source, and explicit-confirmation permanent deletion.
"""
import uuid
import json
from typing import List, Dict, Any, Optional
from backend.database import get_db
from backend.schemas import TrashItemSchema
from backend.services.verification_service import verify_restore_operation

def get_central_trash_items(user_id: str, source_filter: Optional[str] = None) -> List[TrashItemSchema]:
    """Retrieves all recoverable items currently residing in Central Trash."""
    with get_db() as conn:
        cursor = conn.cursor()
        query = """
            SELECT t.id as trash_id, t.item_id, t.source, t.original_location, 
                   t.deleted_at, t.is_restored, t.is_permanently_deleted,
                   d.title, d.sender
            FROM trash_records t
            JOIN digital_items d ON t.item_id = d.id
            WHERE t.user_id = ? AND t.is_restored = 0 AND t.is_permanently_deleted = 0
        """
        params = [user_id]
        if source_filter:
            query += " AND t.source = ?"
            params.append(source_filter)
            
        query += " ORDER BY t.deleted_at DESC"
        cursor.execute(query, params)
        
        return [
            TrashItemSchema(
                trash_id=r["trash_id"],
                item_id=r["item_id"],
                source=r["source"],
                title=r["title"],
                sender_or_owner=r["sender"],
                original_location=r["original_location"] or "Original Location",
                deleted_at=str(r["deleted_at"]),
                is_restored=bool(r["is_restored"]),
                is_permanently_deleted=bool(r["is_permanently_deleted"])
            ) for r in cursor.fetchall()
        ]

def restore_item(user_id: str, item_id: str) -> bool:
    """
    Step 21:
    Restores an item from Central Trash back to its original active location.
    Independently verifies the restore before completing.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, title, source, original_location FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item:
            raise ValueError("Item not found in digital records.")
            
        # 1. Update item active state
        cursor.execute("""
            UPDATE digital_items 
            SET is_in_trash = 0, current_location = original_location
            WHERE id = ?
        """, (item_id,))
        
        # 2. Update trash record ledger
        cursor.execute("""
            UPDATE trash_records 
            SET is_restored = 1, restored_at = CURRENT_TIMESTAMP
            WHERE item_id = ? AND user_id = ? AND is_restored = 0
        """, (item_id, user_id))
        
        # Commit so independent verification can inspect the committed state
        conn.commit()

        # 3. Independent verification
        is_verified, err = verify_restore_operation(item_id, user_id)
        if not is_verified:
            raise RuntimeError(f"Restore verification failed: {err}")
            
        # 4. Log in activity history
        event_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, item_id, event_type, description, details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            event_id, user_id, item_id, "ITEM_RESTORED",
            f"Restored '{item['title']}' from Central Trash to '{item['original_location']}'",
            json.dumps({"source": item["source"], "restored_at": "now"})
        ))
        return True

def permanently_delete_items(user_id: str, item_ids: List[str], confirmed: bool) -> int:
    """
    Step 21:
    Permanently deletes selected items.
    Strictly requires confirmed == True. Never executed automatically.
    """
    if not confirmed:
        raise ValueError("Permanent deletion requires explicit confirmation acknowledgement.")
        
    purged_count = 0
    with get_db() as conn:
        cursor = conn.cursor()
        for item_id in item_ids:
            cursor.execute("SELECT id, title, source FROM digital_items WHERE id = ? AND user_id = ? AND is_in_trash = 1", (item_id, user_id))
            item = cursor.fetchone()
            if not item:
                continue
                
            cursor.execute("""
                UPDATE trash_records 
                SET is_permanently_deleted = 1, permanently_deleted_at = CURRENT_TIMESTAMP
                WHERE item_id = ? AND user_id = ?
            """, (item_id, user_id))
            
            # Delete digital item record
            cursor.execute("DELETE FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
            purged_count += 1
            
            # Log in activity history
            event_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO activity_history (id, user_id, item_id, event_type, description, details)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                event_id, user_id, item_id, "PERMANENT_DELETION",
                f"Permanently purged '{item['title']}' after explicit user confirmation.",
                json.dumps({"source": item["source"]})
            ))
            
    return purged_count
