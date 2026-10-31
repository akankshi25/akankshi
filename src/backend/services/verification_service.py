"""
Questify AI - Action Verification Service
Independently verifies whether a requested operation succeeded at the data source before
awarding XP or transitioning mission state.
"""
from typing import Tuple, Optional
from backend.database import get_db

def verify_trash_operation(item_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
    """
    Checks that the item is indeed flagged in trash and recorded in trash_records.
    In real Google OAuth, checks Gmail / Drive API trash status.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, is_in_trash FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item or not item["is_in_trash"]:
            return False, "Verification check failed: Item not located in trash state."
            
        cursor.execute("SELECT id FROM trash_records WHERE item_id = ? AND is_restored = 0 AND is_permanently_deleted = 0", (item_id,))
        trash_entry = cursor.fetchone()
        if not trash_entry:
            return False, "Verification check failed: Central Trash ledger missing entry."
            
        return True, None

def verify_restore_operation(item_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
    """Verifies item has been restored from trash to active location."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, is_in_trash FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item or item["is_in_trash"]:
            return False, "Verification check failed: Item is still marked as in trash."
            
        cursor.execute("SELECT id FROM trash_records WHERE item_id = ? AND is_restored = 1", (item_id,))
        trash_entry = cursor.fetchone()
        if not trash_entry:
            return False, "Verification check failed: Central Trash ledger does not reflect restored status."
            
        return True, None

def verify_organisation_operation(item_id: str, user_id: str, expected_location: str) -> Tuple[bool, Optional[str]]:
    """Verifies that an item's location/chest tag was updated accurately."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, current_location FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item or item["current_location"] != expected_location:
            return False, f"Verification check failed: Current location does not match expected '{expected_location}'."
        return True, None

def verify_protection_operation(item_id: str, user_id: str) -> Tuple[bool, Optional[str]]:
    """Verifies that the item exists in the protected_items ledger."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, is_protected FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        item = cursor.fetchone()
        if not item or not item["is_protected"]:
            return False, "Verification check failed: Item protection flag is not set."
            
        cursor.execute("SELECT id FROM protected_items WHERE item_id = ? AND user_id = ?", (item_id, user_id))
        prot = cursor.fetchone()
        if not prot:
            return False, "Verification check failed: Protection ledger missing entry."
            
        return True, None

def verify_verdict_operation(item_id: str, user_id: str, expected_verdict: str) -> Tuple[bool, Optional[str]]:
    """Verifies that the scam investigation case file has been closed with a final verdict."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, final_verdict FROM investigation_cases WHERE item_id = ? AND user_id = ?", (item_id, user_id))
        case = cursor.fetchone()
        if not case or case["final_verdict"] != expected_verdict:
            return False, f"Verification check failed: Investigation verdict not recorded or mismatched."
        return True, None
