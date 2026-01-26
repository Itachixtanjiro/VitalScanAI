import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import logging
from fastapi import APIRouter, HTTPException
from typing import Dict, List, Optional
import sqlite3
from pydantic import BaseModel

from db.database import db, DB_PATH

logger = logging.getLogger(__name__)
router = APIRouter()

class TableInfo(BaseModel):
    name: str
    columns: List[Dict]
    foreign_keys: List[Dict]
    row_count: int

class DatabaseSchema(BaseModel):
    database_path: str
    database_size_bytes: int
    tables: Dict[str, TableInfo]

@router.get("/schema", response_model=DatabaseSchema)
async def get_database_schema():
    """
    Get the complete database schema as JSON.
    Includes table structures, columns, foreign keys, and row counts.
    """
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        schema_tables = {}
        
        for table in tables:
            # Get table info
            cursor.execute(f"PRAGMA table_info({table})")
            columns = []
            for row in cursor.fetchall():
                columns.append({
                    "cid": row[0],
                    "name": row[1],
                    "type": row[2],
                    "notnull": bool(row[3]),
                    "default_value": row[4],
                    "pk": bool(row[5])
                })
            
            # Get foreign keys
            cursor.execute(f"PRAGMA foreign_key_list({table})")
            foreign_keys = []
            for row in cursor.fetchall():
                foreign_keys.append({
                    "id": row[0],
                    "table": row[2],
                    "from": row[3],
                    "to": row[4]
                })
            
            # Get row count
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            row_count = cursor.fetchone()[0]
            
            schema_tables[table] = {
                "name": table,
                "columns": columns,
                "foreign_keys": foreign_keys,
                "row_count": row_count
            }
        
        conn.close()
        
        return {
            "database_path": str(DB_PATH),
            "database_size_bytes": DB_PATH.stat().st_size if DB_PATH.exists() else 0,
            "tables": schema_tables
        }
        
    except Exception as e:
        logger.error(f"Failed to get schema: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/data/{table_name}")
async def get_table_data(table_name: str, limit: int = 100, offset: int = 0):
    """
    Get data from a specific table.
    """
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Validate table exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=?", (table_name,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")
        
        # Get data
        cursor.execute(f"SELECT * FROM {table_name} LIMIT ? OFFSET ?", (limit, offset))
        rows = cursor.fetchall()
        
        # Get total count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        total_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "table": table_name,
            "total_rows": total_count,
            "limit": limit,
            "offset": offset,
            "data": [dict(row) for row in rows]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export")
async def export_all_data():
    """
    Export all database data as JSON.
    """
    try:
        conn = sqlite3.connect(str(DB_PATH))
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        all_data = {}
        
        for table in tables:
            cursor.execute(f"SELECT * FROM {table}")
            rows = cursor.fetchall()
            all_data[table] = [dict(row) for row in rows]
        
        conn.close()
        
        return all_data
        
    except Exception as e:
        logger.error(f"Failed to export data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_database_stats():
    """
    Get database statistics.
    """
    try:
        conn = sqlite3.connect(str(DB_PATH))
        cursor = conn.cursor()
        
        # Get all tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        
        stats = {
            "database_path": str(DB_PATH),
            "database_size_bytes": DB_PATH.stat().st_size if DB_PATH.exists() else 0,
            "table_count": len(tables),
            "tables": {}
        }
        
        total_rows = 0
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            stats["tables"][table] = count
            total_rows += count
        
        stats["total_rows"] = total_rows
        
        conn.close()
        
        return stats
        
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))
