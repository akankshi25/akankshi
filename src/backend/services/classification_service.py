"""
Questify AI - Classification Service
Manages digital items retrieval, AI analysis orchestration, and classification persistence.
"""
import uuid
import json
from typing import List, Dict, Any, Optional
from backend.database import get_db
from backend.schemas import DigitalItemSchema, ClassificationSchema, ItemWithClassification
from backend.services.ai_service import analyze_item_with_ai
from backend.seed_data import DEMO_GMAIL_ITEMS, DEMO_DRIVE_ITEMS, DEMO_MESSAGES_ITEMS

def ensure_user_items_for_source(user_id: str, source: str) -> None:
    """Preloads demo items for a source if user has no items yet."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM digital_items WHERE user_id = ? AND source = ?", (user_id, source))
        row = cursor.fetchone()
        if row["count"] > 0:
            return  # Already has items
            
        dataset = []
        if source == "gmail":
            dataset = DEMO_GMAIL_ITEMS
        elif source == "drive":
            dataset = DEMO_DRIVE_ITEMS
        elif source == "messages":
            dataset = DEMO_MESSAGES_ITEMS
            
        for d in dataset:
            item_id = str(uuid.uuid4())
            cursor.execute("""
                INSERT INTO digital_items (
                    id, user_id, source, external_id, title, sender, sender_id, 
                    snippet, date_str, file_type, size_bytes, raw_metadata, 
                    is_protected, is_in_trash, original_location, current_location, tags
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                item_id, user_id, source, d.get("external_id"), d.get("title"),
                d.get("sender"), d.get("sender_id"), d.get("snippet"),
                d.get("date_str"), d.get("file_type"), d.get("size_bytes", 0),
                json.dumps(d), 0, 0, d.get("original_location"), d.get("original_location"),
                json.dumps(d.get("tags", []))
            ))

def analyze_source_items(user_id: str, source: str) -> List[ItemWithClassification]:
    """
    Executes Step 8-11:
    Retrieves permitted data and runs the 2-layer AI classification pipeline.
    Saves or refreshes classifications in the database.
    """
    ensure_user_items_for_source(user_id, source)
    results = []
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, user_id, source, external_id, title, sender, sender_id, 
                   snippet, date_str, file_type, size_bytes, is_protected, 
                   is_in_trash, original_location, current_location, tags
            FROM digital_items
            WHERE user_id = ? AND source = ? AND is_in_trash = 0
            ORDER BY created_at DESC
        """, (user_id, source))
        items = cursor.fetchall()
        
        for row in items:
            item_id = row["id"]
            # Check if active classification exists
            cursor.execute("""
                SELECT id, item_id, security_status, content_category, confidence, 
                       confidence_label, explanation, recommended_action, game, 
                       creature_or_element, is_user_corrected, original_category, user_feedback
                FROM classifications
                WHERE item_id = ?
            """, (item_id,))
            class_row = cursor.fetchone()
            
            if not class_row:
                # Run AI classification
                item_dict = {
                    "title": row["title"],
                    "snippet": row["snippet"],
                    "sender": row["sender"],
                    "sender_id": row["sender_id"],
                    "file_type": row["file_type"],
                    "source": row["source"],
                    "size_bytes": row["size_bytes"]
                }
                ai_result = analyze_item_with_ai(item_dict)
                class_id = str(uuid.uuid4())
                cursor.execute("""
                    INSERT INTO classifications (
                        id, item_id, user_id, security_status, content_category, 
                        confidence, confidence_label, explanation, recommended_action, 
                        game, creature_or_element, is_user_corrected
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    class_id, item_id, user_id,
                    ai_result["security_status"],
                    ai_result["content_category"],
                    ai_result["confidence"],
                    ai_result["confidence_label"],
                    ai_result["explanation"],
                    ai_result["recommended_action"],
                    ai_result["game"],
                    ai_result.get("creature_or_element", ""),
                    0
                ))
                classification = ClassificationSchema(
                    id=class_id,
                    item_id=item_id,
                    security_status=ai_result["security_status"],
                    content_category=ai_result["content_category"],
                    confidence=ai_result["confidence"],
                    confidence_label=ai_result["confidence_label"],
                    explanation=ai_result["explanation"],
                    recommended_action=ai_result["recommended_action"],
                    game=ai_result["game"],
                    creature_or_element=ai_result.get("creature_or_element", ""),
                    is_user_corrected=False
                )
            else:
                classification = ClassificationSchema(
                    id=class_row["id"],
                    item_id=class_row["item_id"],
                    security_status=class_row["security_status"],
                    content_category=class_row["content_category"],
                    confidence=class_row["confidence"],
                    confidence_label=class_row["confidence_label"],
                    explanation=class_row["explanation"],
                    recommended_action=class_row["recommended_action"],
                    game=class_row["game"],
                    creature_or_element=class_row["creature_or_element"],
                    is_user_corrected=bool(class_row["is_user_corrected"]),
                    original_category=class_row["original_category"],
                    user_feedback=class_row["user_feedback"]
                )
                
            tags = []
            try:
                tags = json.loads(row["tags"]) if row["tags"] else []
            except Exception:
                tags = []
                
            item_schema = DigitalItemSchema(
                id=row["id"],
                source=row["source"],
                title=row["title"],
                sender=row["sender"],
                sender_id=row["sender_id"],
                snippet=row["snippet"],
                date_str=row["date_str"],
                file_type=row["file_type"],
                size_bytes=row["size_bytes"],
                is_protected=bool(row["is_protected"]),
                is_in_trash=bool(row["is_in_trash"]),
                original_location=row["original_location"],
                current_location=row["current_location"],
                tags=tags
            )
            results.append(ItemWithClassification(item=item_schema, classification=classification))
            
    return results

def correct_classification(user_id: str, classification_id: str, corrected_category: str, user_reason: Optional[str] = None) -> ClassificationSchema:
    """
    Handles user correction:
    Saves feedback in database for audit & personalization without claiming instant automatic model retraining.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, item_id, user_id, security_status, content_category, confidence, 
                   confidence_label, explanation, recommended_action, game, creature_or_element
            FROM classifications
            WHERE id = ? AND user_id = ?
        """, (classification_id, user_id))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Classification record not found.")
            
        orig_category = row["content_category"]
        new_explanation = f"User corrected from {orig_category} to {corrected_category}."
        if user_reason:
            new_explanation += f" Reason: {user_reason}"
            
        cursor.execute("""
            UPDATE classifications
            SET content_category = ?,
                is_user_corrected = 1,
                original_category = ?,
                user_feedback = ?,
                explanation = ?
            WHERE id = ?
        """, (corrected_category, orig_category, user_reason or "", new_explanation, classification_id))
        
        # Log to activity history
        event_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, item_id, event_type, description, details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            event_id, user_id, row["item_id"], "USER_CORRECTION",
            f"User adjusted category from '{orig_category}' to '{corrected_category}'",
            json.dumps({"classification_id": classification_id, "original": orig_category, "updated": corrected_category})
        ))

        return ClassificationSchema(
            id=row["id"],
            item_id=row["item_id"],
            security_status=row["security_status"],
            content_category=corrected_category,
            confidence=1.0,
            confidence_label="High",
            explanation=new_explanation,
            recommended_action=row["recommended_action"],
            game=row["game"],
            creature_or_element=row["creature_or_element"],
            is_user_corrected=True,
            original_category=orig_category,
            user_feedback=user_reason
        )
