from datetime import datetime
from shapely.geometry import Polygon
from geoalchemy2.elements import WKTElement
from app.core.db import SessionLocal
from app.models.work_order import WorkOrder, WorkOrderStatus

def create_polygon(lon, lat, size=0.001):
    return Polygon([
        (lon, lat),
        (lon + size, lat),
        (lon + size, lat + size),
        (lon, lat + size),
        (lon, lat)
    ])

def run():
    db = SessionLocal()
    try:
        # Pune FC Road (approx: 73.8421, 18.525)
        fc_road_lon, fc_road_lat = 73.8421, 18.5250
        fc_road_poly = create_polygon(fc_road_lon, fc_road_lat)
        fc_road_wkt = WKTElement(fc_road_poly.wkt, srid=4326)
        
        # Scenario A (Triggering the Co-Dig Opportunity)
        wo1 = WorkOrder(
            title="Water Main Upgrade - FC Road",
            requesting_dept_slug="water",
            polygon=fc_road_wkt,
            start_date=datetime(2026, 10, 10),
            end_date=datetime(2026, 10, 15),
            status=WorkOrderStatus.pending
        )
        
        wo2 = WorkOrder(
            title="FC Road Resurfacing",
            requesting_dept_slug="road",
            polygon=fc_road_wkt, # perfectly overlaps
            start_date=datetime(2026, 11, 5),
            end_date=datetime(2026, 11, 10),
            status=WorkOrderStatus.pending
        )
        
        # Pune Telecom (approx: 73.8550, 18.5210)
        telecom_lon, telecom_lat = 73.8550, 18.5210
        telecom_poly = create_polygon(telecom_lon, telecom_lat)
        telecom_wkt = WKTElement(telecom_poly.wkt, srid=4326)
        
        # Scenario B (Showing a Successful Handshake)
        wo3 = WorkOrder(
            title="Fiber Optic Backbone",
            requesting_dept_slug="telecom",
            polygon=telecom_wkt,
            start_date=datetime(2026, 9, 20),
            end_date=datetime(2026, 9, 25),
            status=WorkOrderStatus.approved,
            joint_trench_status="accepted"
        )
        db.add(wo3)
        db.commit()
        db.refresh(wo3)
        
        wo4 = WorkOrder(
            title="Storm Drain Clearance",
            requesting_dept_slug="drainage",
            polygon=telecom_wkt, # overlaps
            start_date=datetime(2026, 9, 20),
            end_date=datetime(2026, 9, 25),
            status=WorkOrderStatus.approved,
            joint_trench_status="accepted",
            linked_work_order_id=wo3.id,
            initiator_work_order_id=wo3.id,
            proposed_joint_start_date=datetime(2026, 9, 20),
            proposed_joint_end_date=datetime(2026, 9, 25)
        )
        db.add(wo4)
        db.commit()
        db.refresh(wo4)
        
        wo3.linked_work_order_id = wo4.id
        wo3.initiator_work_order_id = wo3.id
        wo3.proposed_joint_start_date = datetime(2026, 9, 20)
        wo3.proposed_joint_end_date = datetime(2026, 9, 25)
        
        # Kothrud (approx: 73.8100, 18.5000)
        kothrud_lon, kothrud_lat = 73.8100, 18.5000
        kothrud_poly = create_polygon(kothrud_lon, kothrud_lat)
        kothrud_wkt = WKTElement(kothrud_poly.wkt, srid=4326)
        
        # Scenario C (Standard Isolated Dig)
        wo5 = WorkOrder(
            title="Streetlight Cable Repair - Kothrud",
            requesting_dept_slug="electric",
            polygon=kothrud_wkt,
            start_date=datetime(2026, 9, 28),
            end_date=datetime(2026, 9, 30),
            status=WorkOrderStatus.pending
        )
        
        db.add(wo1)
        db.add(wo2)
        db.add(wo5)
        
        db.commit()
        print("Successfully seeded demo Work Orders!")
        
    except Exception as e:
        print("An error occurred:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    run()
