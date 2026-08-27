from sqlalchemy import Column, Integer, String
from app.core.db import Base


class Department(Base):
    """
    water / electricity / road / traffic / waste / municipal / telecom / emergency
    """
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)       # "Water Department"
    slug = Column(String, unique=True, nullable=False)        # "water"
    contact_email = Column(String, nullable=True)              # for Resend alerts
