"""
Questify AI - Pydantic Request & Response Schemas
"""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# Auth
class UserRegister(BaseModel):
    full_name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    avatar: str
    xp: int
    level: int
    level_title: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Sources & Connections
class ConnectionInfo(BaseModel):
    source: str
    status: str
    account_email: Optional[str] = None
    last_synced: Optional[str] = None
    is_demo: bool = False

class ConnectSourceRequest(BaseModel):
    source: str
    is_demo: bool = True
    account_email: Optional[str] = None

# Digital Items & Classification
class DigitalItemSchema(BaseModel):
    id: str
    source: str
    title: str
    sender: Optional[str] = None
    sender_id: Optional[str] = None
    snippet: Optional[str] = None
    date_str: Optional[str] = None
    file_type: Optional[str] = None
    size_bytes: int = 0
    is_protected: bool = False
    is_in_trash: bool = False
    original_location: Optional[str] = None
    current_location: Optional[str] = None
    tags: List[str] = []

class ClassificationSchema(BaseModel):
    id: str
    item_id: str
    security_status: str  # 'authorised', 'unauthorised', 'unverified'
    content_category: str  # 'promotional', 'academics', 'personal', etc.
    confidence: float
    confidence_label: str  # 'High', 'Medium', 'Low'
    explanation: str
    recommended_action: str  # 'keep', 'protect', 'organise', 'trash', 'investigate'
    game: str  # 'ocean_explorer', 'lost_kingdom', 'guardian_realm', 'scam_detective'
    creature_or_element: Optional[str] = None
    is_user_corrected: bool = False
    original_category: Optional[str] = None
    user_feedback: Optional[str] = None

class ItemWithClassification(BaseModel):
    item: DigitalItemSchema
    classification: ClassificationSchema

class AnalysisStartRequest(BaseModel):
    source: str  # 'gmail', 'drive', 'messages'

class AnalysisResultsResponse(BaseModel):
    analysis_id: str
    source: str
    analyzed_count: int
    results: List[ItemWithClassification]

class AICorrectionRequest(BaseModel):
    classification_id: str
    corrected_category: str
    user_reason: Optional[str] = None

# Actions & Approval
class ActionPreviewRequest(BaseModel):
    item_ids: List[str]
    action_type: str  # 'move_to_trash', 'organise_chest', 'protect_item', 'submit_verdict'
    target_destination: Optional[str] = None
    verdict: Optional[str] = None
    notes: Optional[str] = None

class ActionApproveRequest(BaseModel):
    action_ids: List[str]

class ActionRecordSchema(BaseModel):
    id: str
    item_id: str
    action_type: str
    source: str
    status: str
    target_destination: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    verified_at: Optional[str] = None

class ActionBatchResult(BaseModel):
    success: bool
    verified_count: int
    failed_count: int
    xp_awarded: int
    level_up: bool
    new_level: int
    new_level_title: str
    records: List[ActionRecordSchema]

# Central Trash
class TrashItemSchema(BaseModel):
    trash_id: str
    item_id: str
    source: str
    title: str
    sender_or_owner: Optional[str] = None
    original_location: Optional[str] = None
    deleted_at: str
    is_restored: bool
    is_permanently_deleted: bool

class RestoreItemRequest(BaseModel):
    item_id: str

class PermanentDeleteRequest(BaseModel):
    item_ids: List[str]
    confirmed: bool

# Gamification: Missions, Rewards, Levels
class MissionSchema(BaseModel):
    id: str
    code: str
    title: str
    description: str
    game: str
    xp_reward: int
    target_count: int
    current_count: int
    status: str
    mission_type: str

class AchievementSchema(BaseModel):
    id: str
    code: str
    title: str
    description: str
    icon: str
    unlocked_at: Optional[str] = None

class RewardsSummaryResponse(BaseModel):
    xp: int
    level: int
    level_title: str
    xp_for_next_level: int
    progress_percentage: float
    total_cleaned: int
    total_organised: int
    total_protected: int
    total_investigated: int
    achievements: List[AchievementSchema]

# Financial Shield
class SenderProfileSchema(BaseModel):
    id: str
    sender_identifier: str
    display_name: Optional[str] = None
    first_seen: str
    message_count: int
    trust_status: str
    trust_score: int
    bank_association: Optional[str] = None
    user_notes: Optional[str] = None

class FinancialMessageSchema(BaseModel):
    item: DigitalItemSchema
    classification: ClassificationSchema
    financial_sub_type: str  # 'otp_expected', 'otp_unexpected', 'otp_unverified', 'incoming_txn', 'outgoing_txn', 'bank_alert', 'payment_request', 'fraud_phishing'
    amount: Optional[str] = None
    bank_name: Optional[str] = None
    sender_profile: Optional[SenderProfileSchema] = None

class FinancialShieldResponse(BaseModel):
    selected_bank: Optional[str] = None
    total_financial_messages: int
    security_alerts_count: int
    otps: List[FinancialMessageSchema]
    transactions: List[FinancialMessageSchema]
    alerts_and_requests: List[FinancialMessageSchema]
    senders: List[SenderProfileSchema]

class FinancialReviewRequest(BaseModel):
    item_id: str
    otp_state: Optional[str] = None  # 'expected', 'unexpected', 'unverified'
    user_verdict: Optional[str] = None

# Health Score & Dashboard
class HealthScoreBreakdown(BaseModel):
    overall_score: int  # 0 to 100
    security_status: str  # 'Optimal', 'Good', 'Action Needed', 'Critical'
    protected_count: int
    organised_count: int
    cleanup_count: int
    unresolved_threats_count: int
    breakdown_text: str

class DashboardResponse(BaseModel):
    user: UserResponse
    health: HealthScoreBreakdown
    connections: List[ConnectionInfo]
    game_progress: Dict[str, Any]
    active_missions: List[MissionSchema]
    pending_approvals_count: int
    recent_activity: List[Dict[str, Any]]
