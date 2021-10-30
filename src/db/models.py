from sqlalchemy import Column, String, BigInteger
from db.database import Base
from dataclasses import dataclass
from datetime import datetime

# This is a test DB table example
@dataclass
class User(Base):
    __tablename__ = 'users'

    id: int
    email: str
    firstName: str
    lastName: str

    id = Column(BigInteger, primary_key = True, autoincrement=True)
    email = Column(String(100))
    firstName = Column(String(50))
    lastName = Column(String(50))

    def __init__(self, email, firstName, lastName):
        self.email = email
        self.firstName = firstName
        self.lastName = lastName
