import aiosqlite
import json
import base64
import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pathlib import Path
import asyncio
import aiofiles
from loguru import logger

# Database file location
DB_PATH = Path(__file__).parent.parent / "data" / "vitalscan.db"
UPLOADS_PATH = Path(__file__).parent.parent / "data" / "uploads"

class Database:
    """SQLite database manager for VitalScan analysis persistence."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return

        # Ensure directories exist
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        UPLOADS_PATH.mkdir(parents=True, exist_ok=True)

        self.db_path = str(DB_PATH)
        # Initialize tables - will be created on first async access
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Can't run_until_complete in a running loop, schedule for later
                logger.info(f"Database path set to {self.db_path} - tables will be initialized on first use")
            else:
                loop.run_until_complete(self._create_tables())
                logger.info(f"Database initialized at {self.db_path}")
        except RuntimeError:
            # No event loop, tables will be created on first async access
            logger.info(f"Database path set to {self.db_path} - tables will be initialized on first use")

        self._initialized = True
    
    async def _get_connection(self) -> aiosqlite.Connection:
        """Get async database connection with row factory."""
        conn = await aiosqlite.connect(self.db_path)
        conn.row_factory = aiosqlite.Row
        return conn
    
    async def _create_tables(self):
        """Create database tables if they don't exist."""
        conn = await self._get_connection()
        cursor = await conn.cursor()

        # Analysis Sessions table
        await cursor.execute('''
            CREATE TABLE IF NOT EXISTS analysis_sessions (
                id TEXT PRIMARY KEY,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                overall_status TEXT NOT NULL,
                intensity_level TEXT NOT NULL,
                consensus_state TEXT NOT NULL,
                risk_score REAL NOT NULL,
                narrative_summary TEXT,
                clinical_reasoning TEXT,
                raw_response_json TEXT
            )
        ''')

        # Uploaded Files table
        await cursor.execute('''
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id TEXT PRIMARY KEY,
                session_id TEXT NOT NULL,
                original_filename TEXT NOT NULL,
                file_type TEXT NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
            )
        ''')

        # Biomarkers table
        await cursor.execute('''
            CREATE TABLE IF NOT EXISTS biomarkers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                name TEXT NOT NULL,
                value TEXT NOT NULL,
                unit TEXT NOT NULL,
                status TEXT NOT NULL,
                reference_range TEXT,
                description TEXT,
                FOREIGN KEY (session_id) REFERENCES analysis_sessions(id)
            )
        ''')

        # Imaging Artifacts table
        await cursor.execute('''
            CREATE TABLE IF NOT EXISTS imaging_artifacts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id TEXT NOT NULL,
                modality TEXT NOT NULL,
                findings TEXT,
                source_file_id TEXT,
                bounding_boxes_json TEXT,
                FOREIGN KEY (session_id) REFERENCES analysis_sessions(id),
                FOREIGN KEY (source_file_id) REFERENCES uploaded_files(id)
            )
        ''')

        await conn.commit()
        await conn.close()
        logger.info("Database tables created/verified")
    
    async def save_analysis(
        self,
        overall_status: str,
        intensity_level: str,
        consensus_state: str,
        risk_score: float,
        narrative_summary: str,
        clinical_reasoning: str,
        raw_response: Dict[str, Any]
    ) -> str:
        """Save an analysis session and return the session ID."""
        session_id = str(uuid.uuid4())

        conn = await self._get_connection()
        cursor = await conn.cursor()

        await cursor.execute('''
            INSERT INTO analysis_sessions
            (id, overall_status, intensity_level, consensus_state, risk_score,
             narrative_summary, clinical_reasoning, raw_response_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            session_id,
            overall_status,
            intensity_level,
            consensus_state,
            risk_score,
            narrative_summary,
            clinical_reasoning,
            json.dumps(raw_response)
        ))

        await conn.commit()
        await conn.close()

        logger.info(f"Saved analysis session: {session_id}")
        return session_id
    
    async def save_uploaded_file(
        self,
        session_id: str,
        filename: str,
        file_type: str,
        content: bytes
    ) -> str:
        """Save an uploaded file to disk and record in database - ASYNC to prevent freezing."""
        file_id = str(uuid.uuid4())

        # Create session subdirectory
        session_dir = UPLOADS_PATH / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        # Save file to disk ASYNCHRONOUSLY - prevents blocking event loop!
        file_ext = Path(filename).suffix or ".bin"
        file_path = session_dir / f"{file_id}{file_ext}"

        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)

        # Record in database
        conn = await self._get_connection()
        cursor = await conn.cursor()

        await cursor.execute('''
            INSERT INTO uploaded_files
            (id, session_id, original_filename, file_type, file_path, file_size)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (
            file_id,
            session_id,
            filename,
            file_type,
            str(file_path),
            len(content)
        ))

        await conn.commit()
        await conn.close()

        logger.info(f"Saved file: {filename} -> {file_path}")
        return file_id
    
    async def save_biomarkers(self, session_id: str, biomarkers: List[Dict]):
        """Save biomarkers for a session."""
        if not biomarkers:
            return

        conn = await self._get_connection()
        cursor = await conn.cursor()

        for bio in biomarkers:
            await cursor.execute('''
                INSERT INTO biomarkers
                (session_id, name, value, unit, status, reference_range, description)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                session_id,
                bio.get('name', ''),
                str(bio.get('value', '')),
                bio.get('unit', ''),
                bio.get('status', 'normal'),
                bio.get('reference_range'),
                bio.get('description')
            ))

        await conn.commit()
        await conn.close()
    
    async def save_imaging_artifact(
        self,
        session_id: str,
        modality: str,
        findings: str,
        source_file_id: Optional[str] = None,
        bounding_boxes: Optional[List[Dict]] = None
    ) -> None:
        """Save imaging artifact metadata with bounding boxes - ASYNC."""
        conn = await self._get_connection()
        cursor = await conn.cursor()

        # Convert bounding boxes to JSON string
        bboxes_json = json.dumps(bounding_boxes) if bounding_boxes else None

        await cursor.execute('''
            INSERT INTO imaging_artifacts
            (session_id, modality, findings, source_file_id, bounding_boxes_json)
            VALUES (?, ?, ?, ?, ?)
        ''', (session_id, modality, findings, source_file_id, bboxes_json))

        await conn.commit()
        await conn.close()
    
    async def get_analysis_history(self, limit: int = 20) -> List[Dict]:
        """Get recent analysis sessions."""
        conn = await self._get_connection()
        cursor = await conn.cursor()

        await cursor.execute('''
            SELECT id, created_at, overall_status, intensity_level,
                   consensus_state, risk_score, narrative_summary
            FROM analysis_sessions
            ORDER BY created_at DESC
            LIMIT ?
        ''', (limit,))

        rows = await cursor.fetchall()
        await conn.close()

        return [dict(row) for row in rows]
    
    async def get_analysis_by_id(self, session_id: str) -> Optional[Dict]:
        """Get a specific analysis session with all related data."""
        conn = await self._get_connection()
        cursor = await conn.cursor()

        # Get session
        await cursor.execute('''
            SELECT * FROM analysis_sessions WHERE id = ?
        ''', (session_id,))
        session = await cursor.fetchone()

        if not session:
            await conn.close()
            return None

        result = dict(session)

        # Get files
        await cursor.execute('''
            SELECT * FROM uploaded_files WHERE session_id = ?
        ''', (session_id,))
        result['files'] = [dict(row) for row in await cursor.fetchall()]

        # Get biomarkers
        await cursor.execute('''
            SELECT * FROM biomarkers WHERE session_id = ?
        ''', (session_id,))
        result['biomarkers'] = [dict(row) for row in await cursor.fetchall()]

        # Get imaging artifacts
        await cursor.execute('''
            SELECT * FROM imaging_artifacts WHERE session_id = ?
        ''', (session_id,))
        result['imaging_artifacts'] = [dict(row) for row in await cursor.fetchall()]

        await conn.close()
        return result
    
    async def get_file_path(self, file_id: str) -> Optional[str]:
        """Get the file path for a stored file."""
        conn = await self._get_connection()
        cursor = await conn.cursor()

        await cursor.execute('''
            SELECT file_path FROM uploaded_files WHERE id = ?
        ''', (file_id,))

        row = await cursor.fetchone()
        await conn.close()

        return row['file_path'] if row else None


# Singleton instance
db = Database()
