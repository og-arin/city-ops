from sqlalchemy import text
from app.core.db import engine

def run():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE work_orders ADD COLUMN joint_trench_status VARCHAR"))
            print("Added joint_trench_status")
        except Exception as e:
            print("joint_trench_status:", e)
            
        try:
            conn.execute(text("ALTER TABLE work_orders ADD COLUMN linked_work_order_id INTEGER REFERENCES work_orders(id)"))
            print("Added linked_work_order_id")
        except Exception as e:
            print("linked_work_order_id:", e)
            
        try:
            conn.execute(text("ALTER TABLE work_orders ADD COLUMN proposed_joint_start_date TIMESTAMP"))
            print("Added proposed_joint_start_date")
        except Exception as e:
            print("proposed_joint_start_date:", e)
            
        try:
            conn.execute(text("ALTER TABLE work_orders ADD COLUMN proposed_joint_end_date TIMESTAMP"))
            print("Added proposed_joint_end_date")
        except Exception as e:
            print("proposed_joint_end_date:", e)

if __name__ == "__main__":
    run()
