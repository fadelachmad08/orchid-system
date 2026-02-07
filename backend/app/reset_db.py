"""
Database Reset Script
Run this to clear all data from the database
"""
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.database import engine

def reset_database():
    print("🗑️  Resetting Orchid System Database...")
    print("=" * 50)
    
    with engine.connect() as conn:
        # Disable foreign key checks temporarily
        
        # 1. Delete transaction data first (has foreign keys)
        print("Deleting phase_transitions...")
        conn.execute(text("DELETE FROM phase_transitions"))
        
        # 2. Delete batches
        print("Deleting batches...")
        conn.execute(text("DELETE FROM batches"))
        
        # 3. Delete containers
        print("Deleting containers...")
        conn.execute(text("DELETE FROM containers"))
        
        # 4. Delete master data
        print("Deleting varieties...")
        conn.execute(text("DELETE FROM varieties"))
        
        print("Deleting suppliers...")
        conn.execute(text("DELETE FROM suppliers"))
        
        print("Deleting greenhouses...")
        conn.execute(text("DELETE FROM greenhouses"))
        
        # 5. Reset sequences
        print("\nResetting ID sequences...")
        try:
            conn.execute(text("ALTER SEQUENCE phase_transitions_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE batches_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE containers_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE varieties_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE suppliers_id_seq RESTART WITH 1"))
            conn.execute(text("ALTER SEQUENCE greenhouses_id_seq RESTART WITH 1"))
        except Exception as e:
            print(f"  Note: Some sequences may not exist: {e}")
        
        # Commit changes
        conn.commit()
        
        # 6. Verify
        print("\n" + "=" * 50)
        print("✅ Verification - Row counts:")
        
        tables = ['phase_transitions', 'batches', 'containers', 'varieties', 'suppliers', 'greenhouses']
        for table in tables:
            result = conn.execute(text(f"SELECT COUNT(*) FROM {table}"))
            count = result.scalar()
            print(f"   {table}: {count}")
        
        print("\n" + "=" * 50)
        print("✅ Database reset complete!")
        print("   All data has been cleared.")
        print("   You can now insert fresh test data.")

if __name__ == "__main__":
    confirm = input("⚠️  This will DELETE ALL DATA. Type 'yes' to confirm: ")
    if confirm.lower() == 'yes':
        reset_database()
    else:
        print("❌ Cancelled.")
