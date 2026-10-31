"""
Questify AI - Financial Shield Service
Specialized banking intelligence, OTP state management, and sender trust profiling.
Strictly safeguards against asking for confidential credentials (PINs, CVVs, passwords).
"""
import uuid
import json
import re
from typing import List, Dict, Any, Optional
from backend.database import get_db
from backend.schemas import (
    FinancialShieldResponse, FinancialMessageSchema, SenderProfileSchema,
    DigitalItemSchema, ClassificationSchema
)
from backend.services.classification_service import analyze_source_items

SUPPORTED_BANKS = ["All Banks", "SBI", "HDFC", "ICICI", "Axis Bank", "PNB", "Bank of Baroda", "Other"]

def get_financial_shield_data(user_id: str, bank_filter: Optional[str] = None) -> FinancialShieldResponse:
    """Retrieves all categorized financial and OTP messages for the user."""
    analyze_source_items(user_id, "messages")
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Ensure sender profiles exist for senders
        cursor.execute("SELECT DISTINCT sender_id, sender FROM digital_items WHERE user_id = ? AND source = 'messages'", (user_id,))
        for row in cursor.fetchall():
            s_id = row["sender_id"] or "Unknown"
            cursor.execute("SELECT id FROM sender_profiles WHERE user_id = ? AND sender_identifier = ?", (user_id, s_id))
            if not cursor.fetchone():
                profile_id = str(uuid.uuid4())
                trust = "unverified"
                score = 50
                bank_assoc = "Other"
                s_lower = s_id.lower()
                if "icici" in s_lower:
                    bank_assoc = "ICICI"
                    trust = "trusted"
                    score = 90
                elif "hdfc" in s_lower:
                    bank_assoc = "HDFC"
                    trust = "trusted"
                    score = 90
                elif "sbi" in s_lower:
                    bank_assoc = "SBI"
                    trust = "unverified"
                    score = 65
                elif "axis" in s_lower:
                    bank_assoc = "Axis Bank"
                    trust = "trusted"
                    score = 88
                elif s_id.startswith("+") or len(re.sub(r'\D', '', s_id)) == 10:
                    trust = "suspicious"
                    score = 25
                    
                cursor.execute("""
                    INSERT INTO sender_profiles (id, user_id, sender_identifier, display_name, trust_status, trust_score, bank_association)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (profile_id, user_id, s_id, row["sender"], trust, score, bank_assoc))

        # Query messages with their classifications
        cursor.execute("""
            SELECT d.id, d.source, d.title, d.sender, d.sender_id, d.snippet, d.date_str, 
                   d.file_type, d.size_bytes, d.is_protected, d.is_in_trash, d.raw_metadata,
                   c.id as class_id, c.security_status, c.content_category, c.confidence, 
                   c.confidence_label, c.explanation, c.recommended_action, c.game, 
                   c.creature_or_element, c.is_user_corrected, c.original_category, c.user_feedback
            FROM digital_items d
            LEFT JOIN classifications c ON d.id = c.item_id
            WHERE d.user_id = ? AND d.source = 'messages' AND d.is_in_trash = 0
            ORDER BY d.created_at DESC
        """, (user_id,))
        items = cursor.fetchall()
        
        otps = []
        transactions = []
        alerts_and_requests = []
        security_alerts_count = 0
        
        for r in items:
            raw_meta = {}
            try:
                raw_meta = json.loads(r["raw_metadata"]) if r["raw_metadata"] else {}
            except Exception:
                raw_meta = {}
                
            fin_type = raw_meta.get("financial_sub_type", "unverified")
            bank_name = raw_meta.get("bank_name", "Other")
            
            if bank_filter and bank_filter != "All Banks" and bank_name.lower() != bank_filter.lower():
                continue
                
            # Sender profile
            cursor.execute("""
                SELECT id, sender_identifier, display_name, first_seen, message_count, 
                       trust_status, trust_score, bank_association, user_notes
                FROM sender_profiles 
                WHERE user_id = ? AND sender_identifier = ?
            """, (user_id, r["sender_id"] or "Unknown"))
            s_prof = cursor.fetchone()
            sender_schema = None
            if s_prof:
                sender_schema = SenderProfileSchema(
                    id=s_prof["id"],
                    sender_identifier=s_prof["sender_identifier"],
                    display_name=s_prof["display_name"],
                    first_seen=str(s_prof["first_seen"]),
                    message_count=s_prof["message_count"],
                    trust_status=s_prof["trust_status"],
                    trust_score=s_prof["trust_score"],
                    bank_association=s_prof["bank_association"],
                    user_notes=s_prof["user_notes"]
                )

            item_schema = DigitalItemSchema(
                id=r["id"],
                source=r["source"],
                title=r["title"],
                sender=r["sender"],
                sender_id=r["sender_id"],
                snippet=r["snippet"],
                date_str=r["date_str"],
                file_type=r["file_type"],
                size_bytes=r["size_bytes"],
                is_protected=bool(r["is_protected"]),
                is_in_trash=bool(r["is_in_trash"]),
                tags=[]
            )
            class_schema = ClassificationSchema(
                id=r["class_id"] or "unclassified",
                item_id=r["id"],
                security_status=r["security_status"] or "unverified",
                content_category=r["content_category"] or "otp_security",
                confidence=r["confidence"] or 0.85,
                confidence_label=r["confidence_label"] or "Medium",
                explanation=r["explanation"] or "Financial message scan.",
                recommended_action=r["recommended_action"] or "review",
                game=r["game"] or "guardian_realm",
                creature_or_element=r["creature_or_element"] or "vault_pillar",
                is_user_corrected=bool(r["is_user_corrected"])
            )
            
            msg = FinancialMessageSchema(
                item=item_schema,
                classification=class_schema,
                financial_sub_type=fin_type,
                bank_name=bank_name,
                sender_profile=sender_schema
            )
            
            if class_schema.security_status == "unauthorised" or fin_type == "otp_unexpected":
                security_alerts_count += 1
                
            if "otp" in fin_type or class_schema.content_category == "otp_security":
                otps.append(msg)
            elif "txn" in fin_type or class_schema.content_category == "transactions":
                transactions.append(msg)
            else:
                alerts_and_requests.append(msg)
                
        # Get all sender profiles
        cursor.execute("SELECT id, sender_identifier, display_name, first_seen, message_count, trust_status, trust_score, bank_association, user_notes FROM sender_profiles WHERE user_id = ?", (user_id,))
        senders = [
            SenderProfileSchema(
                id=sp["id"],
                sender_identifier=sp["sender_identifier"],
                display_name=sp["display_name"],
                first_seen=str(sp["first_seen"]),
                message_count=sp["message_count"],
                trust_status=sp["trust_status"],
                trust_score=sp["trust_score"],
                bank_association=sp["bank_association"],
                user_notes=sp["user_notes"]
            ) for sp in cursor.fetchall()
        ]

        return FinancialShieldResponse(
            selected_bank=bank_filter or "All Banks",
            total_financial_messages=len(otps) + len(transactions) + len(alerts_and_requests),
            security_alerts_count=security_alerts_count,
            otps=otps,
            transactions=transactions,
            alerts_and_requests=alerts_and_requests,
            senders=senders
        )

def update_otp_review(user_id: str, item_id: str, otp_state: str, user_verdict: Optional[str] = None) -> bool:
    """Updates user confirmation for an OTP (Expected vs Unexpected vs Unverified)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, raw_metadata FROM digital_items WHERE id = ? AND user_id = ?", (item_id, user_id))
        row = cursor.fetchone()
        if not row:
            raise ValueError("Financial item not found.")
            
        raw = json.loads(row["raw_metadata"]) if row["raw_metadata"] else {}
        raw["financial_sub_type"] = f"otp_{otp_state}"
        cursor.execute("UPDATE digital_items SET raw_metadata = ? WHERE id = ?", (json.dumps(raw), item_id))
        
        # Log to activity history
        event_id = str(uuid.uuid4())
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, item_id, event_type, description, details)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            event_id, user_id, item_id, "FINANCIAL_SHIELD_REVIEW",
            f"User reviewed OTP and marked status as '{otp_state.upper()}'",
            json.dumps({"otp_state": otp_state, "user_verdict": user_verdict})
        ))
        return True
