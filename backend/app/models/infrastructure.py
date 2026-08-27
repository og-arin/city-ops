from sqlalchemy import Column, Integer, String
from geoalchemy2 import Geometry
from app.core.db import Base


class InfrastructureAsset(Base):
    """
    One row = one physical asset: a road segment, a water pipe run, an electric
    cable run, or a telecom fiber run. `layer` says which, `geom` is the actual
    shape (LineString for pipes/cables/roads, Polygon if you want road-width areas).

    This single-table-per-layer-type design (instead of 4 separate tables) is
    deliberate: conflict detection becomes one query against one table instead
    of a UNION across four. Keeps the spatial service dead simple.
    """
    __tablename__ = "infrastructure_assets"

    id = Column(Integer, primary_key=True, index=True)
    layer = Column(String, nullable=False, index=True)   # "road" | "water" | "electric" | "telecom"
    name = Column(String, nullable=False)                 # "Road X - Sector 12" / "Water Main A"
    owner_dept_slug = Column(String, nullable=False)       # which dept owns/maintains this asset
    depth_meters = Column(Integer, nullable=True)           # underground depth, if known
    geom = Column(Geometry(geometry_type="GEOMETRY", srid=4326), nullable=False)
