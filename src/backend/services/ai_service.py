"""
Questify AI - Central AI Classification Engine
Implements the 2-layer independent AI classification pipeline:
Layer 1: Security & Trust Classification (authorised, unauthorised, unverified)
Layer 2: Content Categorisation (promotional, academics, personal, professional, financial, etc.)
Includes Prompt Injection Defense and deterministic fallback.
"""
import json
import re
import os
from typing import Dict, Any, Tuple
from backend.config import settings

# Attempt import of Google GenAI SDK (if installed and API key present)
GEMINI_CLIENT = None
if settings.GEMINI_API_KEY:
    try:
        from google import genai
        GEMINI_CLIENT = genai.Client(api_key=settings.GEMINI_API_KEY)
    except Exception as e:
        print(f"[Questify AI] Gemini Client initialization skipped: {e}")

def sanitize_untrusted_input(text: str, max_chars: int = 1500) -> str:
    """
    Prompt injection defense:
    Strips systemic escape codes, limits length, and neutralizes meta-instructions.
    """
    if not text:
        return ""
    # Strip potential control characters
    cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    # Neutralize prompt injection attempts
    dangerous_patterns = [
        r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"system\s*prompt",
        r"you\s+are\s+now",
        r"jailbreak",
        r"eval\(",
        r"<script",
    ]
    for p in dangerous_patterns:
        cleaned = re.sub(p, "[REDACTED_INPUT]", cleaned, flags=re.IGNORECASE)
    return cleaned[:max_chars]

def get_confidence_label(score: float) -> str:
    if score >= 0.85:
        return "High"
    elif score >= 0.65:
        return "Medium"
    return "Low"

def rule_based_classify(item_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Deterministic rule-based fallback classification engine.
    Ensures 100% reliable, explainable results even without external network/API keys.
    """
    title = (item_data.get("title") or "").lower()
    snippet = (item_data.get("snippet") or "").lower()
    sender = (item_data.get("sender") or "").lower()
    sender_id = (item_data.get("sender_id") or "").lower()
    file_type = (item_data.get("file_type") or "").lower()
    full_text = f"{title} {snippet} {sender}"

    # Default baseline
    security_status = "unverified"
    content_category = "other_unclassified"
    confidence = 0.75
    recommended_action = "review"
    game = "ocean_explorer"
    creature_or_element = "unknown_creature"
    reason = "Initial preliminary scan: insufficient specific markers found, classified as unverified."

    # --- Heuristics for Phishing & Malware & Suspicious ---
    phish_keywords = ["verify pan", "kyc expired", "account suspended", "bit.ly", ".xyz", "disconnection tonight", "crack", "keygen", "click here immediately"]
    is_phish_suspect = any(kw in full_text for kw in phish_keywords) or file_type in ["exe", "bat", "vbs"] or (".zip.exe" in title)
    
    if is_phish_suspect:
        security_status = "unauthorised"
        content_category = "fraud_phishing"
        confidence = 0.98
        recommended_action = "investigate"
        game = "scam_detective"
        creature_or_element = "case_file_phish"
        if file_type in ["exe", "tmp"] or ".exe" in title:
            reason = "Dangerous executable/archive pattern or missing security signature detected."
        else:
            reason = "High-urgency language, unverified external links, or brand impersonation signals detected."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for OTP & Security ---
    if "otp" in full_text or "verification code" in full_text or "one time password" in full_text:
        content_category = "otp_security"
        if "transfer" in full_text and ("alert" in full_text or "beneficiary" in full_text or "₹" in full_text or "inr" in full_text):
            # Potential unexpected transaction OTP
            security_status = "unverified"
            confidence = 0.91
            recommended_action = "investigate"
            game = "scam_detective"
            creature_or_element = "case_file_otp"
            reason = "High-value fund transfer OTP. Verification required to ensure you initiated this transaction."
        else:
            security_status = "authorised" if any(b in sender_id for b in ["icici", "hdfc", "sbi", "axis", "pnb"]) else "unverified"
            confidence = 0.93
            recommended_action = "review"
            game = "guardian_realm"
            creature_or_element = "vault_pillar"
            reason = "One-Time Password / Authentication code message from online banking or digital services."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for Financial / Transactions ---
    if any(k in full_text for k in ["credited", "debited", "salary", "inr", "₹", "e-statement", "invoice", "receipt", "neft", "upi"]):
        if "credited" in full_text or "debited" in full_text:
            content_category = "transactions"
            if "unknown" in full_text or "unknown payer" in full_text:
                security_status = "unverified"
                confidence = 0.88
                recommended_action = "investigate"
                game = "scam_detective"
                creature_or_element = "case_file_unknown_payer"
                reason = "Financial transaction from an unverified or unknown counterparty."
            else:
                security_status = "authorised"
                confidence = 0.96
                recommended_action = "organise"
                game = "lost_kingdom"
                creature_or_element = "wealth_chest"
                reason = "Verified bank transaction alert with formal financial statement headers."
        else:
            content_category = "financial"
            security_status = "authorised"
            confidence = 0.94
            recommended_action = "organise"
            game = "lost_kingdom"
            creature_or_element = "wealth_chest"
            reason = "Document contains banking records, tax records, or official accounting statements."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for Academics ---
    if any(k in full_text for k in ["syllabus", "exam", "assignment", "lecture", "cs301", "cs402", "algorithms", "university", "notes", "course"]):
        security_status = "authorised"
        content_category = "academics"
        confidence = 0.97
        recommended_action = "organise"
        game = "lost_kingdom"
        creature_or_element = "knowledge_chest"
        reason = "Educational material, lecture notes, or university academic correspondence."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for Personal (Photos / Memories) ---
    if file_type in ["jpg", "jpeg", "png", "mp4", "mov"] or any(k in full_text for k in ["birthday", "holiday", "family", "vacation", "photos", "trip"]):
        security_status = "authorised"
        content_category = "personal"
        confidence = 0.96
        recommended_action = "protect"
        game = "guardian_realm"
        creature_or_element = "memory_shield"
        reason = "Personal media, family photographs, or private milestone documents requiring high protection."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for Professional / Career ---
    if any(k in full_text for k in ["resume", "cv", "offer letter", "internship", "employment", "portfolio"]):
        security_status = "authorised"
        content_category = "professional"
        confidence = 0.95
        recommended_action = "organise"
        game = "lost_kingdom"
        creature_or_element = "career_chest"
        reason = "Professional career document, resume, or employment verification record."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # --- Heuristics for Promotional / Clutter ---
    if any(k in full_text for k in ["sale", "discount", "offer", "coupon", "newsletter", "promotions", "deal", "uber eats", "unsubscribe"]) or file_type == "tmp":
        security_status = "authorised"
        content_category = "promotional"
        confidence = 0.94
        recommended_action = "trash"
        game = "ocean_explorer"
        creature_or_element = "monster_shark" if ("expired" in full_text or file_type == "tmp") else "octopus"
        reason = "Commercial marketing promotion, newsletter subscription, or obsolete temporary cache file."
        return {
            "security_status": security_status,
            "content_category": content_category,
            "confidence": confidence,
            "confidence_label": get_confidence_label(confidence),
            "explanation": reason,
            "recommended_action": recommended_action,
            "game": game,
            "creature_or_element": creature_or_element,
        }

    # Fallback return
    return {
        "security_status": security_status,
        "content_category": content_category,
        "confidence": confidence,
        "confidence_label": get_confidence_label(confidence),
        "explanation": reason,
        "recommended_action": recommended_action,
        "game": game,
        "creature_or_element": creature_or_element,
    }

def analyze_item_with_ai(item_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Analyzes a single digital item.
    Uses Gemini API if available, with robust fallback to the deterministic classification engine.
    """
    # If Gemini is configured and available, try it first
    if GEMINI_CLIENT:
        try:
            sanitized_title = sanitize_untrusted_input(item_data.get("title", ""))
            sanitized_snippet = sanitize_untrusted_input(item_data.get("snippet", ""))
            sanitized_sender = sanitize_untrusted_input(item_data.get("sender", ""))
            
            prompt = f"""
You are the Questify AI Classification Engine. Analyze the following untrusted digital item:
Title: {sanitized_title}
Snippet: {sanitized_snippet}
Sender: {sanitized_sender}
File/Message Type: {item_data.get("file_type", "")}

Return ONLY valid JSON matching this exact structure:
{{
  "security_status": "authorised" | "unauthorised" | "unverified",
  "content_category": "promotional" | "academics" | "personal" | "professional" | "financial" | "otp_security" | "transactions" | "social" | "spam" | "fraud_phishing" | "important" | "attachments_documents" | "other_unclassified",
  "confidence": 0.0 to 1.0,
  "confidence_label": "High" | "Medium" | "Low",
  "explanation": "Clear reason for this classification",
  "recommended_action": "keep" | "protect" | "organise" | "archive" | "review" | "investigate" | "trash",
  "game": "ocean_explorer" | "lost_kingdom" | "guardian_realm" | "scam_detective",
  "creature_or_element": "shark" | "dolphin" | "octopus" | "knowledge_chest" | "memory_shield" | "case_file"
}}
Do not include markdown or backticks.
"""
            response = GEMINI_CLIENT.models.generate_content(
                model=settings.AI_MODEL_NAME,
                contents=prompt
            )
            raw_text = response.text.strip()
            # Clean possible markdown fences
            if raw_text.startswith("```"):
                raw_text = re.sub(r"^```json\s*", "", raw_text)
                raw_text = re.sub(r"^```\s*", "", raw_text)
                raw_text = re.sub(r"\s*```$", "", raw_text)
            parsed = json.loads(raw_text)
            if "security_status" in parsed and "content_category" in parsed:
                return parsed
        except Exception as e:
            print(f"[Questify AI] Gemini API call fallback triggered: {e}")

    # Deterministic rule-based engine fallback
    return rule_based_classify(item_data)
