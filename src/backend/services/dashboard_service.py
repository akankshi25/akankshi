"""
Questify AI - Dashboard & Digital Health Score Service
Calculates meaningful security metrics, tracks all 4 game worlds, and summarizes recent audits.
"""
from typing import Dict, Any, List
from backend.database import get_db
from backend.schemas import (
    DashboardResponse, HealthScoreBreakdown, ConnectionInfo,
    MissionSchema, UserResponse
)
from backend.services.auth_service import get_user_by_id
from backend.services.mission_service import get_user_missions

def calculate_digital_health_score(user_id: str) -> HealthScoreBreakdown:
    """
    Computes Digital Health Score:
    Not based solely on number of deleted items. Evaluates:
    - Protected vital assets (+25 max)
    - Organised digital knowledge (+25 max)
    - Cleaned clutter (+25 max)
    - Addressed security threats (+25 max)
    - Deducts heavily for unresolved critical threats.
    """
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Protected items
        cursor.execute("SELECT COUNT(*) as c FROM protected_items WHERE user_id = ?", (user_id,))
        prot_count = cursor.fetchone()["c"]
        prot_pts = min(25, prot_count * 12)
        
        # 2. Organised items
        cursor.execute("SELECT COUNT(*) as c FROM action_records WHERE user_id = ? AND action_type = 'organise_chest' AND status = 'verified'", (user_id,))
        org_count = cursor.fetchone()["c"]
        org_pts = min(25, org_count * 12)
        
        # 3. Cleaned items in trash
        cursor.execute("SELECT COUNT(*) as c FROM trash_records WHERE user_id = ? AND is_restored = 0", (user_id,))
        clean_count = cursor.fetchone()["c"]
        clean_pts = min(25, clean_count * 10)
        
        # 4. Unresolved security threats
        cursor.execute("""
            SELECT COUNT(*) as c 
            FROM classifications c
            JOIN digital_items d ON c.item_id = d.id
            WHERE c.user_id = ? AND c.security_status = 'unauthorised' AND d.is_in_trash = 0
        """, (user_id,))
        unresolved_threats = cursor.fetchone()["c"]
        
        # Threat points: starts at 25, drops 15 per unresolved threat
        threat_pts = max(0, 25 - (unresolved_threats * 15))
        
        raw_score = prot_pts + org_pts + clean_pts + threat_pts
        overall_score = min(100, max(15, raw_score))
        
        status = "Optimal"
        if unresolved_threats > 0:
            status = "Critical Threats Active"
        elif overall_score >= 80:
            status = "Excellent"
        elif overall_score >= 50:
            status = "Good / Action Needed"
        else:
            status = "Needs Attention"

        breakdown = (
            f"Protection: {prot_pts}/25 pts ({prot_count} shielded) | "
            f"Organisation: {org_pts}/25 pts ({org_count} sorted) | "
            f"Cleanup: {clean_pts}/25 pts ({clean_count} purged) | "
            f"Threat Shield: {threat_pts}/25 pts ({unresolved_threats} active threats)"
        )
        
        return HealthScoreBreakdown(
            overall_score=overall_score,
            security_status=status,
            protected_count=prot_count,
            organised_count=org_count,
            cleanup_count=clean_count,
            unresolved_threats_count=unresolved_threats,
            breakdown_text=breakdown
        )

def get_dashboard_summary(user_id: str) -> DashboardResponse:
    user = get_user_by_id(user_id)
    health = calculate_digital_health_score(user_id)
    missions = get_user_missions(user_id)
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Connections
        cursor.execute("SELECT source, status, account_email, last_synced, is_demo FROM connections WHERE user_id = ?", (user_id,))
        connections = [
            ConnectionInfo(
                source=r["source"],
                status=r["status"],
                account_email=r["account_email"],
                last_synced=str(r["last_synced"]) if r["last_synced"] else None,
                is_demo=bool(r["is_demo"])
            ) for r in cursor.fetchall()
        ]
        
        # Pending approvals count
        cursor.execute("SELECT COUNT(*) as c FROM action_records WHERE user_id = ? AND status = 'awaiting_approval'", (user_id,))
        pending_count = cursor.fetchone()["c"]
        
        # Four Game Worlds progress
        cursor.execute("SELECT COUNT(*) as c FROM trash_records WHERE user_id = ? AND is_restored = 0", (user_id,))
        ocean_cleaned = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM action_records WHERE user_id = ? AND action_type = 'organise_chest' AND status = 'verified'", (user_id,))
        kingdom_sorted = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM protected_items WHERE user_id = ?", (user_id,))
        guardian_shielded = cursor.fetchone()["c"]
        
        cursor.execute("SELECT COUNT(*) as c FROM investigation_cases WHERE user_id = ? AND final_verdict IS NOT NULL", (user_id,))
        scam_resolved = cursor.fetchone()["c"]
        
        game_progress = {
            "ocean_explorer": {
                "title": "Ocean Explorer",
                "focus": "Digital cleanup & deletion",
                "completed_actions": ocean_cleaned,
                "banner_tag": "Underwater Depths"
            },
            "lost_kingdom": {
                "title": "Lost Kingdom",
                "focus": "Digital organisation & chests",
                "completed_actions": kingdom_sorted,
                "banner_tag": "Treasury & Archives"
            },
            "guardian_realm": {
                "title": "Guardian Realm",
                "focus": "Protecting vital content",
                "completed_actions": guardian_shielded,
                "banner_tag": "Citadel Shields"
            },
            "scam_detective": {
                "title": "Scam Detective",
                "focus": "Threats & phishing investigations",
                "completed_actions": scam_resolved,
                "banner_tag": "Mystery Noir Office"
            }
        }
        
        # Recent activity
        cursor.execute("""
            SELECT id, event_type, description, details, created_at
            FROM activity_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 10
        """, (user_id,))
        recent_activity = [
            {
                "id": r["id"],
                "event_type": r["event_type"],
                "description": r["description"],
                "created_at": str(r["created_at"])
            } for r in cursor.fetchall()
        ]
        
    return DashboardResponse(
        user=user,
        health=health,
        connections=connections,
        game_progress=game_progress,
        active_missions=missions,
        pending_approvals_count=pending_count,
        recent_activity=recent_activity
    )
