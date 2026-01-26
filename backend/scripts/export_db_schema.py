import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import json
import sqlite3
from pathlib import Path
from db.database import db, DB_PATH

def get_schema_info():
    """Extract database schema information."""
    conn = sqlite3.connect(str(DB_PATH))
    cursor = conn.cursor()
    
    # Get all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [row[0] for row in cursor.fetchall()]
    
    schema = {}
    
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
                "seq": row[1],
                "table": row[2],
                "from": row[3],
                "to": row[4],
                "on_update": row[5],
                "on_delete": row[6]
            })
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        row_count = cursor.fetchone()[0]
        
        schema[table] = {
            "columns": columns,
            "foreign_keys": foreign_keys,
            "row_count": row_count
        }
    
    conn.close()
    return schema

def export_schema_to_json(output_path: str = "database_schema.json"):
    """Export database schema to JSON file."""
    print("Initializing database...")
    # This will create tables if they don't exist
    db._create_tables()
    
    print("Extracting schema...")
    schema = get_schema_info()
    
    # Add metadata
    full_schema = {
        "database_path": str(DB_PATH),
        "database_exists": DB_PATH.exists(),
        "database_size_bytes": DB_PATH.stat().st_size if DB_PATH.exists() else 0,
        "tables": schema
    }
    
    # Save to JSON
    output_file = Path(output_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(full_schema, f, indent=2, ensure_ascii=False)
    
    print(f"\n✅ Schema exported to: {output_file.absolute()}")
    print(f"\n📊 Database Summary:")
    print(f"   Location: {DB_PATH}")
    print(f"   Size: {full_schema['database_size_bytes']} bytes")
    print(f"   Tables: {len(schema)}")
    
    for table_name, table_info in schema.items():
        print(f"\n   📋 {table_name}:")
        print(f"      Columns: {len(table_info['columns'])}")
        print(f"      Foreign Keys: {len(table_info['foreign_keys'])}")
        print(f"      Rows: {table_info['row_count']}")
    
    return full_schema

def view_table_data(table_name: str, limit: int = 10):
    """View data from a specific table."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    
    try:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT ?", (limit,))
        rows = cursor.fetchall()
        
        data = [dict(row) for row in rows]
        
        print(f"\n📊 {table_name} (showing {len(data)} rows):")
        print(json.dumps(data, indent=2, default=str))
        
        return data
    except sqlite3.Error as e:
        print(f"Error reading table {table_name}: {e}")
        return []
    finally:
        conn.close()

def export_all_data(output_path: str = "database_data.json"):
    """Export all database data to JSON."""
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
    
    # Save to JSON
    output_file = Path(output_path)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, default=str, ensure_ascii=False)
    
    print(f"\n✅ All data exported to: {output_file.absolute()}")
    
    for table, data in all_data.items():
        print(f"   {table}: {len(data)} rows")
    
    return all_data

if __name__ == "__main__":
    print("=" * 60)
    print("VitalScan AI - Database Schema Exporter")
    print("=" * 60)
    
    # Export schema
    schema = export_schema_to_json("backend/database_schema.json")
    
    # Export data
    print("\n" + "=" * 60)
    print("Exporting database data...")
    print("=" * 60)
    data = export_all_data("backend/database_data.json")
    
    # Show sample data from each table
    print("\n" + "=" * 60)
    print("Sample Data Preview")
    print("=" * 60)
    
    for table in schema["tables"].keys():
        if schema["tables"][table]["row_count"] > 0:
            view_table_data(table, limit=3)
