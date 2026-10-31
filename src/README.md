# QUESTIFY AI

> **Clean Your Digital World. Complete Quests. Earn Rewards.**

An AI-powered digital organisation, security-awareness, and productivity web application that transforms digital clutter cleanup into an interactive gaming experience across four connected game worlds.

---

## 🎮 The Four Connected Game Worlds

1. **Ocean Explorer (Digital Cleanup & Deletion)**
   - Defeat Large Monster Sharks representing promotional emails, duplicate files, and temporary caches.
   - Interactive Bio-Scanner reveals AI explanations and risk assessments.
   - Requires explicit user approval; backend independently verifies deletion before the creature disappears and awards +10 XP.
   - Automatically moves items into Central Trash for safe recovery.

2. **Lost Kingdom (Digital Organisation & Treasure Hunting)**
   - Sort documents into ancient stronghold chests on an interactive kingdom map.
   - **Knowledge Chest** (Academics / Lecture Notes) -> *University Library*
   - **Memory Chest** (Personal Photos / Videos) -> *Memory Garden*
   - **Career Chest** (Resumes / Internships) -> *Royal Castle*
   - **Wealth Chest** (Statements / Taxes) -> *Treasury Cave*
   - **Mystery Chest** (Unclassified Files) -> *Mystery Forest*
   - Verifies folder assignment and awards +10 XP.

3. **Guardian Realm (Protecting Vital Digital Content)**
   - Protect irreplaceable family memories, degree certificates, and essential credentials.
   - Cast **Aegis Guardian Wards**, **Citadel Vault Labels**, or **Immutable Memory Markers**.
   - Shielded assets cannot be accidentally cleaned up in bulk; awards +10 XP.

4. **Scam Detective (Investigating Threats & Phishing)**
   - Examine evidence on suspicious emails, fake bank notices, and malicious attachments.
   - Clue Board analyzes sender identity, urgency tactics, link domains, and credentials requests.
   - Render investigator verdicts: *Possible Phishing*, *Suspicious*, *Unverified*, or *Likely Safe*.
   - Retains suspicious messages for evidence; awards +15 XP upon verified verdict.

---

## 🛡️ Financial Shield & Banking Intelligence

- **OTP Classification**: Automatically distinguishes between *Expected*, *Unexpected*, and *Unverified* One-Time Passwords.
- **Transaction Streams**: Classifies incoming salary credits, unknown payer UPI credits, and debit alerts.
- **Bank Recognition**: Filter intelligence for **SBI, HDFC, ICICI, Axis Bank, PNB, Bank of Baroda, and Other Banks**.
- **Sender Intelligence Registry**: Profiles sender identifiers with trust scores (0-100), history, and impersonation warning flags.
- **Zero Confidential Credential Policy**: Strictly safeguards never to request or store PINs, passwords, CVVs, or full card numbers.

---

## 🗑️ Central Trash & Recovery Vault

- Dedicated Central Trash section with tabs: **Email Trash**, **Drive Trash**, and **Messages Sandbox**.
- **Restore**: Restores items to their original source locations after independent verification checks.
- **Permanent Deletion**: Separate, high-security action requiring explicit checkbox confirmation and warning acknowledgment.

---

## 🧠 Central AI Classification Engine (2-Layer Pipeline)

1. **Layer 1: Security & Trust Classification**
   - Assigns `Authorised`, `Unauthorised`, or `Unverified` based on sender metadata, domain authenticity, and prompt-injection-safe heuristics.
2. **Layer 2: Content Categorisation**
   - Assigns category: `Promotional`, `Academics`, `Personal`, `Professional`, `Financial`, `OTP & Security`, `Transactions`, `Social`, `Spam`, `Fraud / Phishing`, `Important`, or `Other`.
3. **User Corrections**: Users can correct AI categories. Feedback is recorded to personal history for future preference without claiming instant automatic model retraining.

---

## 🏆 Shared XP & Level Progression

- **Levels**:
  1. Beginner Explorer (0–99 XP)
  2. Digital Adventurer (100–249 XP)
  3. Realm Protector (250–499 XP)
  4. Master Organiser (500–899 XP)
  5. Questify Guardian (900–1499 XP)
  6. Digital Legend (1500+ XP)
- **Achievements**: Ocean Saver, Treasure Hunter, Guardian of Memories, Scam Investigator, Inbox Master, Digital Safety Champion.
- **Idempotency**: Prevent duplicate XP through backend unique constraint transactions.

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start the FastAPI Backend
```bash
cd backend
python -m uvicorn backend.main:app --host 0.0.0.0 --port 3001 --reload
```
*Backend runs on `http://localhost:3001` with Swagger docs at `http://localhost:3001/docs`.*

### 2. Start the Vite Frontend
```bash
# In the frontend directory
npm run dev
```
*Frontend runs on `http://localhost:3000` and automatically proxies `/api` requests to port 3001.*

### 3. Run Automated Acceptance Tests (Tests A through L)
```bash
python backend/test_acceptance.py
```

---

## 🧪 Acceptance Test Results

All 12 mandatory workflows tested and verified:
- [x] **Test A**: User Registration, Login & Dashboard Access (PASSED)
- [x] **Test B**: Demo Gmail Analysis & 2-Layer Classification (PASSED)
- [x] **Test C**: Ocean Explorer Deletion & Central Trash Verification (PASSED)
- [x] **Test D**: Lost Kingdom Academic Document Sorting & Knowledge Chest (PASSED)
- [x] **Test E**: Guardian Realm Asset Protection & Shielding (PASSED)
- [x] **Test F**: Scam Detective Phishing Investigation & Verdict Record (PASSED)
- [x] **Test G**: Financial Shield OTP & Unknown Payer Analysis (PASSED)
- [x] **Test H**: Central Trash Restoration to Original Location (PASSED)
- [x] **Test I**: Permanent Deletion Explicit Confirmation Safeguard (PASSED)
- [x] **Test J**: Saved Progress & XP Idempotency across Sessions (PASSED)
- [x] **Test K**: Failure Handling & Zero XP for Incomplete Actions (PASSED)
- [x] **Test L**: Complete Multi-User Isolation (PASSED)
