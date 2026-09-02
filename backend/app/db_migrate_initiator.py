from sqlalchemy import text
from app.core.db import engine

def run():
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE work_orders ADD COLUMN initiator_work_order_id INTEGER REFERENCES work_orders(id)"))
            print("Added initiator_work_order_id")
        except Exception as e:
            print("initiator_work_order_id:", e)

if __name__ == "__main__":
    run()
