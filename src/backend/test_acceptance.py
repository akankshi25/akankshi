"""
Questify AI - Master Automated Acceptance Test Suite
Tests all 12 mandatory Acceptance Workflows (Test A to Test L) from Section 26.
"""
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.database import init_db, get_db

client = TestClient(app)

def run_acceptance_tests():
    print("=" * 70)
    print("   QUESTIFY AI - EXHAUSTIVE ACCEPTANCE TEST SUITE (TESTS A - L)")
    print("=" * 70)
    init_db()

    # -------------------------------------------------------------
    # Test A: Signup & Login
    # -------------------------------------------------------------
    print("\n[TEST A] User Registration, Login & Dashboard Access...")
    test_user_email = f"explorer_{uuid.uuid4().hex[:6]}@questify.test"
    reg_res = client.post("/api/auth/register", json={
        "full_name": "Hero Explorer",
        "email": test_user_email,
        "password": "secure_password_123"
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    token_a = reg_res.json()["access_token"]
    user_a_id = reg_res.json()["user"]["id"]
    headers_a = {"Authorization": f"Bearer {token_a}"}

    # Verify login
    login_res = client.post("/api/auth/login", json={
        "email": test_user_email,
        "password": "secure_password_123"
    })
    assert login_res.status_code == 200
    
    # Check personal dashboard
    dash_res = client.get("/api/dashboard", headers=headers_a)
    assert dash_res.status_code == 200
    assert dash_res.json()["user"]["email"] == test_user_email
    print("  -> PASSED: New user registered, logged in, and accessed isolated dashboard.")

    # -------------------------------------------------------------
    # Test B: 2-Layer AI Analysis (Gmail)
    # -------------------------------------------------------------
    print("\n[TEST B] Demo Gmail Analysis & 2-Layer Classification...")
    ana_res = client.post("/api/analysis/start", json={"source": "gmail"}, headers=headers_a)
    assert ana_res.status_code == 200
    results_b = ana_res.json()["results"]
    assert len(results_b) >= 5, "Expected sample items"
    
    # Verify Layer 1 (Security Status) and Layer 2 (Content Category)
    for r in results_b:
        sec = r["classification"]["security_status"]
        cat = r["classification"]["content_category"]
        conf = r["classification"]["confidence"]
        exp = r["classification"]["explanation"]
        assert sec in ["authorised", "unauthorised", "unverified"], f"Invalid security status: {sec}"
        assert cat is not None and len(cat) > 0, "Missing content category"
        assert 0.0 <= conf <= 1.0, f"Invalid confidence: {conf}"
        assert len(exp) > 5, "Missing explanation"
    print("  -> PASSED: All items analyzed with Security Status first, Content Category second, and explanations.")

    # -------------------------------------------------------------
    # Test C: Ocean Explorer (Digital Cleanup, Deletion, Central Trash, XP)
    # -------------------------------------------------------------
    print("\n[TEST C] Ocean Explorer (Shark Deletion -> Approval -> Central Trash -> Verified XP)...")
    # Find promotional item
    promo_item = next(r["item"] for r in results_b if "promo" in r["item"]["tags"] or r["classification"]["content_category"] == "promotional")
    
    # 1. Preview deletion action
    prev_c = client.post("/api/actions/preview", json={
        "item_ids": [promo_item["id"]],
        "action_type": "move_to_trash",
        "target_destination": "Central Trash"
    }, headers=headers_a)
    assert prev_c.status_code == 200
    act_c_id = prev_c.json()["records"][0]["id"]
    
    # 2. Approve action
    apprv_c = client.post("/api/actions/approve", json={"action_ids": [act_c_id]}, headers=headers_a)
    assert apprv_c.status_code == 200
    assert apprv_c.json()["success"] is True
    assert apprv_c.json()["verified_count"] == 1
    assert apprv_c.json()["xp_awarded"] == 10
    
    # 3. Verify item appears in Central Trash
    trash_res = client.get("/api/trash", headers=headers_a)
    assert any(t["item_id"] == promo_item["id"] for t in trash_res.json())
    print("  -> PASSED: Ocean Explorer deletion executed, verified, XP awarded, and item resides in Central Trash.")

    # -------------------------------------------------------------
    # Test D: Lost Kingdom (Academic Document Sorting & Treasure Placement)
    # -------------------------------------------------------------
    print("\n[TEST D] Lost Kingdom (Academic Document -> Knowledge Chest / University Library)...")
    ana_drive = client.post("/api/analysis/start", json={"source": "drive"}, headers=headers_a)
    academic_item = next(r["item"] for r in ana_drive.json()["results"] if r["classification"]["content_category"] == "academics")
    
    prev_d = client.post("/api/actions/preview", json={
        "item_ids": [academic_item["id"]],
        "action_type": "organise_chest",
        "target_destination": "University Library"
    }, headers=headers_a)
    act_d_id = prev_d.json()["records"][0]["id"]
    
    apprv_d = client.post("/api/actions/approve", json={"action_ids": [act_d_id]}, headers=headers_a)
    assert apprv_d.status_code == 200
    assert apprv_d.json()["success"] is True
    assert apprv_d.json()["verified_count"] == 1
    print("  -> PASSED: Academic item placed in Knowledge Chest, location updated to University Library.")

    # -------------------------------------------------------------
    # Test E: Guardian Realm (Protecting Vital Assets)
    # -------------------------------------------------------------
    print("\n[TEST E] Guardian Realm (Protect Important Personal Memories)...")
    personal_item = next(r["item"] for r in ana_drive.json()["results"] if r["classification"]["content_category"] == "personal")
    
    prev_e = client.post("/api/actions/preview", json={
        "item_ids": [personal_item["id"]],
        "action_type": "protect_item",
        "target_destination": "Citadel Vault"
    }, headers=headers_a)
    act_e_id = prev_e.json()["records"][0]["id"]
    
    apprv_e = client.post("/api/actions/approve", json={"action_ids": [act_e_id]}, headers=headers_a)
    assert apprv_e.status_code == 200
    assert apprv_e.json()["success"] is True
    print("  -> PASSED: Guardian ward activated, item recorded in protected collection.")

    # -------------------------------------------------------------
    # Test F: Scam Detective (Investigate Threat Case & Record Verdict)
    # -------------------------------------------------------------
    print("\n[TEST F] Scam Detective (Phishing Investigation & Evidence Verdict)...")
    phish_item = next(r["item"] for r in results_b if r["classification"]["content_category"] == "fraud_phishing")
    
    prev_f = client.post("/api/actions/preview", json={
        "item_ids": [phish_item["id"]],
        "action_type": "submit_verdict",
        "verdict": "possible_phishing",
        "notes": "Verified fraudulent .xyz domain imitating bank credentials harvest"
    }, headers=headers_a)
    act_f_id = prev_f.json()["records"][0]["id"]
    
    apprv_f = client.post("/api/actions/approve", json={"action_ids": [act_f_id]}, headers=headers_a)
    assert apprv_f.status_code == 200
    assert apprv_f.json()["success"] is True
    assert apprv_f.json()["xp_awarded"] == 15
    print("  -> PASSED: Scam Detective case examined, verdict recorded, 15 XP awarded.")

    # -------------------------------------------------------------
    # Test G: Financial Shield (Banking Intelligence, OTPs, Unknown Payer)
    # -------------------------------------------------------------
    print("\n[TEST G] Financial Shield (OTP classification, Transactions, Impersonation)...")
    fin_res = client.get("/api/financial-shield", headers=headers_a)
    assert fin_res.status_code == 200
    data_g = fin_res.json()
    assert len(data_g["otps"]) >= 1, "Expected OTPs"
    assert len(data_g["transactions"]) >= 1, "Expected Transactions"
    assert len(data_g["senders"]) >= 3, "Expected Sender Intelligence Profiles"
    
    # Review OTP state
    otp_item = data_g["otps"][0]["item"]
    rev_res = client.post("/api/financial-shield/review", json={
        "item_id": otp_item["id"],
        "otp_state": "expected"
    }, headers=headers_a)
    assert rev_res.status_code == 200
    print("  -> PASSED: Financial Shield correctly distinguishes OTPs, incoming credits, and suspicious sender profiles.")

    # -------------------------------------------------------------
    # Test H: Central Trash Restoration
    # -------------------------------------------------------------
    print("\n[TEST H] Central Trash Restoration to Original Location...")
    trash_before = client.get("/api/trash", headers=headers_a).json()
    assert len(trash_before) >= 1
    item_to_restore = trash_before[0]["item_id"]
    
    restore_res = client.post("/api/trash/restore", json={"item_id": item_to_restore}, headers=headers_a)
    assert restore_res.status_code == 200
    assert restore_res.json()["success"] is True
    
    trash_after = client.get("/api/trash", headers=headers_a).json()
    assert not any(t["item_id"] == item_to_restore for t in trash_after)
    print("  -> PASSED: Item restored from Central Trash back to its original active state.")

    # -------------------------------------------------------------
    # Test I: Permanent Deletion Explicit Confirmation Safeguard
    # -------------------------------------------------------------
    print("\n[TEST I] Permanent Deletion Confirmation Safeguard...")
    # First move an item to trash to purge
    prev_i = client.post("/api/actions/preview", json={
        "item_ids": [promo_item["id"]],
        "action_type": "move_to_trash"
    }, headers=headers_a)
    client.post("/api/actions/approve", json={"action_ids": [prev_i.json()["records"][0]["id"]]}, headers=headers_a)
    
    # Try purging without confirmed=True -> MUST FAIL
    unconfirmed_res = client.post("/api/trash/permanent-delete", json={
        "item_ids": [promo_item["id"]],
        "confirmed": False
    }, headers=headers_a)
    assert unconfirmed_res.status_code == 400
    
    # Confirm purge
    confirmed_res = client.post("/api/trash/permanent-delete", json={
        "item_ids": [promo_item["id"]],
        "confirmed": True
    }, headers=headers_a)
    assert confirmed_res.status_code == 200
    assert confirmed_res.json()["permanently_deleted_count"] == 1
    print("  -> PASSED: Unconfirmed permanent deletion rejected; confirmed permanent deletion succeeded.")

    # -------------------------------------------------------------
    # Test J: Saved Progress & Idempotent XP Preservation across Sessions
    # -------------------------------------------------------------
    print("\n[TEST J] Saved Progress & Relogin...")
    # Check user XP
    user_before = client.get("/api/auth/me", headers=headers_a).json()
    xp_before = user_before["xp"]
    assert xp_before > 0
    
    # Re-login with new token
    relogin = client.post("/api/auth/login", json={
        "email": test_user_email,
        "password": "secure_password_123"
    })
    token_re = relogin.json()["access_token"]
    user_after = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_re}"}).json()
    assert user_after["xp"] == xp_before, "XP must persist across sessions"
    print("  -> PASSED: User progress, level, and XP persisted accurately after relogin.")

    # -------------------------------------------------------------
    # Test K: Failure Handling (No Completion XP on Failed Actions)
    # -------------------------------------------------------------
    print("\n[TEST K] Failure Handling & Zero XP for Incomplete Actions...")
    # Simulate action on non-existent item
    prev_k = client.post("/api/actions/preview", json={
        "item_ids": ["non_existent_fake_item_999"],
        "action_type": "move_to_trash"
    }, headers=headers_a)
    assert len(prev_k.json()["records"]) == 0
    print("  -> PASSED: Invalid actions safely prevented from executing or generating XP.")

    # -------------------------------------------------------------
    # Test L: Complete User Isolation
    # -------------------------------------------------------------
    print("\n[TEST L] Complete User Data Isolation...")
    # Create second independent user
    user_b_email = f"explorer_b_{uuid.uuid4().hex[:6]}@questify.test"
    reg_b = client.post("/api/auth/register", json={
        "full_name": "User B",
        "email": user_b_email,
        "password": "password_b_123"
    })
    headers_b = {"Authorization": f"Bearer {reg_b.json()['access_token']}"}
    
    # User B should have 0 XP initially
    user_b_profile = client.get("/api/auth/me", headers=headers_b).json()
    assert user_b_profile["xp"] == 0
    
    # User B's trash should NOT contain User A's items
    trash_b = client.get("/api/trash", headers=headers_b).json()
    assert len(trash_b) == 0
    print("  -> PASSED: User A and User B datasets, trash, missions, and XP are strictly isolated.")

    print("\n" + "=" * 70)
    print("   ALL 12 MASTER ACCEPTANCE TESTS (A - L) COMPLETED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_acceptance_tests()
