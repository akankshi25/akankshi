"""
Questify AI - FastAPI Main Application & REST API
Clean, production-grade endpoints for all Questify AI game worlds, AI classification,
action approvals, Central Trash, missions, and rewards.
"""
import uuid
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Header, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from backend.config import settings
from backend.database import init_db, get_db
from backend.schemas import (
    UserRegister, UserLogin, UserResponse, TokenResponse,
    ConnectSourceRequest, ConnectionInfo,
    AnalysisStartRequest, AnalysisResultsResponse, AICorrectionRequest,
    ActionPreviewRequest, ActionApproveRequest, ActionBatchResult,
    RestoreItemRequest, PermanentDeleteRequest, TrashItemSchema,
    RewardsSummaryResponse, FinancialShieldResponse, FinancialReviewRequest,
    DashboardResponse, MissionSchema
)
from backend.services.auth_service import (
    create_user_profile, authenticate_user, get_user_by_id, get_or_create_demo_user
)
from backend.services.classification_service import (
    analyze_source_items, correct_classification
)
from backend.services.action_service import (
    preview_actions, approve_and_execute_actions
)
from backend.services.trash_service import (
    get_central_trash_items, restore_item, permanently_delete_items
)
from backend.services.reward_service import (
    get_user_rewards_summary
)
from backend.services.mission_service import (
    get_user_missions
)
from backend.services.financial_shield_service import (
    get_financial_shield_data, update_otp_review
)
from backend.services.dashboard_service import (
    get_dashboard_summary
)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Gamified AI Digital Organization, Protection & Threat Intelligence Platform"
)

# Enable CORS for frontend Vite dev server (port 3000 / any origin)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()
    # Ensure demo account is seeded
    get_or_create_demo_user()
    print(f"[{settings.APP_NAME}] Initialized database and seeded demo user successfully.")

# Helper to extract user_id from Authorization header
def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    """Extracts or resolves user_id. Defaults to standard demo user if unauthenticated."""
    if not authorization:
        demo_user = get_or_create_demo_user()
        return demo_user.id
        
    token = authorization.replace("Bearer ", "").strip()
    if token.startswith("user_"):
        user_id = token.replace("user_", "")
        user = get_user_by_id(user_id)
        if user:
            return user.id
            
    demo_user = get_or_create_demo_user()
    return demo_user.id

# ==========================================
# 1. Health & Status
# ==========================================
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "ai_provider": "Gemini API" if settings.GEMINI_API_KEY else "Deterministic Rule-Based Fallback Engine",
        "demo_mode_ready": True
    }

# ==========================================
# 2. Authentication
# ==========================================
@app.post("/api/auth/register", response_model=TokenResponse)
def register(req: UserRegister):
    try:
        user = create_user_profile(req)
        token = f"user_{user.id}"
        return TokenResponse(access_token=token, user=user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login", response_model=TokenResponse)
def login(req: UserLogin):
    user = authenticate_user(req)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = f"user_{user.id}"
    return TokenResponse(access_token=token, user=user)

@app.post("/api/auth/demo-login", response_model=TokenResponse)
def demo_login():
    """One-click instant login into Questify AI Demo Mode."""
    user = get_or_create_demo_user()
    token = f"user_{user.id}"
    return TokenResponse(access_token=token, user=user)

@app.get("/api/auth/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id)):
    user = get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return user

# ==========================================
# 3. Dashboard
# ==========================================
@app.get("/api/dashboard", response_model=DashboardResponse)
def get_dashboard(user_id: str = Depends(get_current_user_id)):
    return get_dashboard_summary(user_id)

# ==========================================
# 4. Digital Connections
# ==========================================
@app.get("/api/connections", response_model=List[ConnectionInfo])
def list_connections(user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT source, status, account_email, last_synced, is_demo FROM connections WHERE user_id = ?", (user_id,))
        return [
            ConnectionInfo(
                source=r["source"],
                status=r["status"],
                account_email=r["account_email"],
                last_synced=str(r["last_synced"]) if r["last_synced"] else None,
                is_demo=bool(r["is_demo"])
            ) for r in cursor.fetchall()
        ]

@app.post("/api/connections/connect", response_model=ConnectionInfo)
def connect_source(req: ConnectSourceRequest, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cursor = conn.cursor()
        email = req.account_email or f"{req.source}.explorer@questify.ai"
        cursor.execute("""
            INSERT OR REPLACE INTO connections (id, user_id, source, status, account_email, is_demo, last_synced)
            VALUES (?, ?, ?, 'connected', ?, ?, CURRENT_TIMESTAMP)
        """, (str(uuid.uuid4()), user_id, req.source, email, 1 if req.is_demo else 0))
        
        # Log to activity history
        cursor.execute("""
            INSERT INTO activity_history (id, user_id, event_type, description, details)
            VALUES (?, ?, 'SOURCE_CONNECTED', ?, ?)
        """, (str(uuid.uuid4()), user_id, f"Connected {req.source.title()} ({'Demo' if req.is_demo else 'OAuth'})", json.dumps({"source": req.source})))

        return ConnectionInfo(
            source=req.source,
            status="connected",
            account_email=email,
            is_demo=req.is_demo
        )

@app.delete("/api/connections/{source}")
def disconnect_source(source: str, user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE connections SET status = 'not_connected', account_email = NULL WHERE user_id = ? AND source = ?", (user_id, source))
        return {"success": True, "source": source, "status": "not_connected"}

# ==========================================
# 5. AI Analysis Engine
# ==========================================
@app.post("/api/analysis/start", response_model=AnalysisResultsResponse)
def start_analysis(req: AnalysisStartRequest, user_id: str = Depends(get_current_user_id)):
    results = analyze_source_items(user_id, req.source)
    analysis_id = str(uuid.uuid4())
    return AnalysisResultsResponse(
        analysis_id=analysis_id,
        source=req.source,
        analyzed_count=len(results),
        results=results
    )

@app.get("/api/analysis/results", response_model=AnalysisResultsResponse)
def get_analysis_results(source: str = Query("gmail"), user_id: str = Depends(get_current_user_id)):
    results = analyze_source_items(user_id, source)
    return AnalysisResultsResponse(
        analysis_id=str(uuid.uuid4()),
        source=source,
        analyzed_count=len(results),
        results=results
    )

@app.post("/api/analysis/correct")
def correct_ai_classification(req: AICorrectionRequest, user_id: str = Depends(get_current_user_id)):
    try:
        updated = correct_classification(user_id, req.classification_id, req.corrected_category, req.user_reason)
        return {"success": True, "classification": updated}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# 6. Action Execution & Approvals
# ==========================================
@app.post("/api/actions/preview")
def preview_action_intent(req: ActionPreviewRequest, user_id: str = Depends(get_current_user_id)):
    records = preview_actions(user_id, req)
    return {"records": records, "awaiting_approval_count": len(records)}

@app.post("/api/actions/approve", response_model=ActionBatchResult)
def approve_actions(req: ActionApproveRequest, user_id: str = Depends(get_current_user_id)):
    res = approve_and_execute_actions(user_id, req.action_ids)
    return res

@app.get("/api/actions/pending")
def list_pending_actions(user_id: str = Depends(get_current_user_id)):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.item_id, a.action_type, a.source, a.status, a.target_destination, a.details,
                   d.title, d.snippet, d.sender
            FROM action_records a
            JOIN digital_items d ON a.item_id = d.id
            WHERE a.user_id = ? AND a.status = 'awaiting_approval'
            ORDER BY a.proposed_at DESC
        """, (user_id,))
        return [
            {
                "id": r["id"],
                "item_id": r["item_id"],
                "action_type": r["action_type"],
                "source": r["source"],
                "status": r["status"],
                "target_destination": r["target_destination"],
                "title": r["title"],
                "snippet": r["snippet"],
                "sender": r["sender"],
                "details": json.loads(r["details"]) if r["details"] else {}
            } for r in cursor.fetchall()
        ]

# ==========================================
# 7. Central Trash & Recovery
# ==========================================
@app.get("/api/trash", response_model=List[TrashItemSchema])
def list_trash(source: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    return get_central_trash_items(user_id, source)

@app.post("/api/trash/restore")
def restore_trash(req: RestoreItemRequest, user_id: str = Depends(get_current_user_id)):
    try:
        success = restore_item(user_id, req.item_id)
        return {"success": success, "message": "Item restored to source location."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/trash/permanent-delete")
def permanent_delete(req: PermanentDeleteRequest, user_id: str = Depends(get_current_user_id)):
    try:
        count = permanently_delete_items(user_id, req.item_ids, req.confirmed)
        return {"success": True, "permanently_deleted_count": count}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# 8. Shared XP, Missions & Rewards
# ==========================================
@app.get("/api/rewards", response_model=RewardsSummaryResponse)
def get_rewards(user_id: str = Depends(get_current_user_id)):
    return get_user_rewards_summary(user_id)

@app.get("/api/missions", response_model=List[MissionSchema])
def list_missions(user_id: str = Depends(get_current_user_id)):
    return get_user_missions(user_id)

# ==========================================
# 9. Financial Shield
# ==========================================
@app.get("/api/financial-shield", response_model=FinancialShieldResponse)
def get_financial_shield(bank: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    return get_financial_shield_data(user_id, bank)

@app.post("/api/financial-shield/review")
def review_financial_item(req: FinancialReviewRequest, user_id: str = Depends(get_current_user_id)):
    try:
        res = update_otp_review(user_id, req.item_id, req.otp_state or "unverified", req.user_verdict)
        return {"success": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# ==========================================
# 10. Activity History
# ==========================================
@app.get("/api/history")
def get_activity_history(
    event_filter: Optional[str] = None, 
    search: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    with get_db() as conn:
        cursor = conn.cursor()
        query = "SELECT id, item_id, event_type, description, details, created_at FROM activity_history WHERE user_id = ?"
        params = [user_id]
        if event_filter:
            query += " AND event_type = ?"
            params.append(event_filter)
        if search:
            query += " AND description LIKE ?"
            params.append(f"%{search}%")
            
        query += " ORDER BY created_at DESC LIMIT 50"
        cursor.execute(query, params)
        return [
            {
                "id": r["id"],
                "item_id": r["item_id"],
                "event_type": r["event_type"],
                "description": r["description"],
                "created_at": str(r["created_at"])
            } for r in cursor.fetchall()
        ]

# ==========================================
# 11. Settings & Data Reset
# ==========================================
@app.post("/api/settings/reset-demo")
def reset_demo_data(user_id: str = Depends(get_current_user_id)):
    """Resets user data back to clean initial demo state."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM digital_items WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM classifications WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM action_records WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM trash_records WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM protected_items WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM investigation_cases WHERE user_id = ?", (user_id,))
        cursor.execute("DELETE FROM activity_history WHERE user_id = ?", (user_id,))
        cursor.execute("UPDATE users SET xp = 0, level = 1, level_title = 'Beginner Explorer' WHERE id = ?", (user_id,))
        cursor.execute("UPDATE missions SET current_count = 0, status = 'in_progress' WHERE user_id = ?", (user_id,))
    return {"success": True, "message": "Demo data reset successfully."}
