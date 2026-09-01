import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(".env")
DATABASE_URL = os.getenv("DATABASE_URL")

def clone_roads_to_utilities():
    print("🔌 Connecting to PostgreSQL...")
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()

    try:
        # Clear out the old spiderweb and empty layers
        print("🗑️ Deleting old utility data...")
        cursor.execute("DELETE FROM infrastructure_assets WHERE layer IN ('water', 'electric', 'telecom');")
        
        # Clone the road geometry for Water, Electric, and Telecom
        layers_to_create = [
            ("water", "water"), 
            ("electric", "electric"), 
            ("telecom", "telecom")
        ]
        
        for layer_name, dept_slug in layers_to_create:
            print(f"🧬 Cloning roads to create realistic {layer_name} network...")
            cursor.execute(f"""
                INSERT INTO infrastructure_assets (layer, name, owner_dept_slug, geom)
                SELECT '{layer_name}', name || ' ({layer_name.capitalize()} Line)', '{dept_slug}', geom
                FROM infrastructure_assets
                WHERE layer = 'road';
            """)
            
        conn.commit()
        print("🎉 All utility layers successfully cloned and seeded!")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Database error: {e}")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    clone_roads_to_utilities()