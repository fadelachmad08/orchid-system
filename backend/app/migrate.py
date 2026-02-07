"""
Migration script - Run once to add missing columns
"""
import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def run_migration():
    print("🔄 Connecting to database...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("✅ Connected!")
        
        # Check if column exists
        result = conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'batches' AND column_name = 'date_a5_entry'
        """))
        
        if result.fetchone():
            print("✅ Column 'date_a5_entry' already exists")
        else:
            print("➕ Adding column 'date_a5_entry'...")
            conn.execute(text("ALTER TABLE batches ADD COLUMN date_a5_entry DATE"))
            conn.commit()
            print("✅ Column 'date_a5_entry' added successfully!")
        
        # Check phase_transitions table
        result = conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name = 'phase_transitions'
        """))
        
        if result.fetchone():
            print("✅ Table 'phase_transitions' already exists")
        else:
            print("➕ Creating table 'phase_transitions'...")
            conn.execute(text("""
                CREATE TABLE phase_transitions (
                    id SERIAL PRIMARY KEY,
                    batch_id INTEGER NOT NULL REFERENCES batches(id),
                    from_phase VARCHAR(2) NOT NULL,
                    to_phase VARCHAR(2) NOT NULL,
                    quantity_before INTEGER NOT NULL,
                    quantity_moved INTEGER NOT NULL,
                    quantity_loss INTEGER DEFAULT 0,
                    loss_reason VARCHAR(50),
                    loss_notes TEXT,
                    transition_date DATE NOT NULL,
                    created_by INTEGER REFERENCES users(id),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT
                )
            """))
            conn.execute(text("CREATE INDEX idx_phase_transitions_batch_id ON phase_transitions(batch_id)"))
            conn.commit()
            print("✅ Table 'phase_transitions' created successfully!")
        
        print("\n🎉 Migration completed!")

if __name__ == "__main__":
    run_migration()
