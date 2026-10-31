"""
Questify AI - SQLite Database Connection & Initializer
Thread-safe SQLite database schema and helper functions.
"""
import sqlite3
import json
import os
from contextlib import contextmanager
from backend.config import settings

def get_db_path():
    return settings.DB_PATH

@contextmanager
def get_db():
    conn = sqlite3.connect(get_db_path(), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def init_db():
    """Initializes all database tables required by Questify AI."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. Users
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT NOT NULL,
            avatar TEXT DEFAULT '🧙‍♂️',
            xp INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            level_title TEXT DEFAULT 'Beginner Explorer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Connections (Gmail, Google Drive, Messages)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS connections (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            source TEXT NOT NULL, -- 'gmail', 'drive', 'messages'
            status TEXT NOT NULL, -- 'connected', 'not_connected', 'connecting', 'expired'
            account_email TEXT,
            access_token TEXT,
            refresh_token TEXT,
            token_expiry TIMESTAMP,
            last_synced TIMESTAMP,
            is_demo INTEGER DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, source)
        );
        """)

        # 3. Digital Items (Emails, Files, SMS/OTPs)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS digital_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            source TEXT NOT NULL, -- 'gmail', 'drive', 'messages'
            external_id TEXT,
            title TEXT NOT NULL,
            sender TEXT,
            sender_id TEXT,
            snippet TEXT,
            date_str TEXT,
            file_type TEXT,
            size_bytes INTEGER DEFAULT 0,
            raw_metadata TEXT, -- JSON
            is_protected INTEGER DEFAULT 0,
            is_in_trash INTEGER DEFAULT 0,
            original_location TEXT,
            current_location TEXT,
            tags TEXT, -- JSON array
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 4. Classifications (2-layer AI results)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS classifications (
            id TEXT PRIMARY KEY,
            item_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            security_status TEXT NOT NULL, -- 'authorised', 'unauthorised', 'unverified'
            content_category TEXT NOT NULL, -- 'promotional', 'academics', 'personal', etc.
            confidence REAL NOT NULL,
            confidence_label TEXT NOT NULL, -- 'High', 'Medium', 'Low'
            explanation TEXT NOT NULL,
            recommended_action TEXT NOT NULL, -- 'keep', 'protect', 'organise', 'trash', 'investigate'
            game TEXT NOT NULL, -- 'ocean_explorer', 'lost_kingdom', 'guardian_realm', 'scam_detective'
            creature_or_element TEXT, -- shark, dolphin, knowledge_chest, etc.
            is_user_corrected INTEGER DEFAULT 0,
            original_category TEXT,
            user_feedback TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES digital_items(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 5. Action Records (Lifecycle: proposed -> awaiting_approval -> approved -> executing -> verified / failed)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS action_records (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            action_type TEXT NOT NULL, -- 'move_to_trash', 'organise_chest', 'protect_item', 'submit_verdict', 'restore_item', 'permanent_delete'
            source TEXT NOT NULL,
            status TEXT NOT NULL, -- 'proposed', 'awaiting_approval', 'approved', 'executing', 'verified', 'failed', 'reversed'
            target_destination TEXT,
            proposed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_at TIMESTAMP,
            executed_at TIMESTAMP,
            verified_at TIMESTAMP,
            details TEXT, -- JSON details
            error_message TEXT,
            FOREIGN KEY(item_id) REFERENCES digital_items(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 6. Trash Records
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS trash_records (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            source TEXT NOT NULL,
            original_location TEXT,
            deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_restored INTEGER DEFAULT 0,
            is_permanently_deleted INTEGER DEFAULT 0,
            restored_at TIMESTAMP,
            permanently_deleted_at TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES digital_items(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 7. XP Transactions & Idempotent Ledger
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS xp_transactions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            action_id TEXT,
            mission_id TEXT,
            xp_amount INTEGER NOT NULL,
            reason TEXT NOT NULL,
            idempotency_key TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 8. Missions
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS missions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            code TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            game TEXT NOT NULL,
            xp_reward INTEGER DEFAULT 50,
            target_count INTEGER DEFAULT 1,
            current_count INTEGER DEFAULT 0,
            status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
            mission_type TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'epic'
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 9. Achievements
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS achievements (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            code TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            icon TEXT NOT NULL,
            unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, code)
        );
        """)

        # 10. Activity History
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS activity_history (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            item_id TEXT,
            event_type TEXT NOT NULL,
            description TEXT NOT NULL,
            details TEXT, -- JSON
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)

        # 11. Sender Profiles & Financial Intelligence
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS sender_profiles (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            sender_identifier TEXT NOT NULL,
            display_name TEXT,
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            message_count INTEGER DEFAULT 1,
            trust_status TEXT DEFAULT 'unverified', -- 'trusted', 'suspicious', 'unverified', 'phishing_source'
            trust_score INTEGER DEFAULT 50,
            bank_association TEXT, -- 'SBI', 'HDFC', 'ICICI', etc.
            user_notes TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, sender_identifier)
        );
        """)

        # 12. Protected Items
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS protected_items (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            protection_type TEXT NOT NULL, -- 'vault_label', 'read_only_marker', 'guardian_shield'
            notes TEXT,
            protected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES digital_items(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE(user_id, item_id)
        );
        """)

        # 13. Investigation Cases (Scam Detective)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS investigation_cases (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            item_id TEXT NOT NULL,
            clues_json TEXT NOT NULL,
            initial_threat_level TEXT DEFAULT 'medium',
            final_verdict TEXT, -- 'likely_safe', 'suspicious', 'possible_phishing', 'unverified', 'insufficient_evidence'
            user_notes TEXT,
            resolved_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(item_id) REFERENCES digital_items(id) ON DELETE CASCADE,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        """)
