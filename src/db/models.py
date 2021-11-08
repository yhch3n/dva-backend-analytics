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

@dataclass
class Tweet(Base):
    __tablename__ = 'tweet'

    id: int
    tweet_id: str
    place: str
    text: str
    time: str

    id = Column(BigInteger, primary_key = True, autoincrement=True)
    tweet_id = Column(String(30))
    place = Column(String(20))
    text = Column(String(200))
    time = Column(String(20))

    def __init__(self, tweet_id=tweet_id, place=place, text=text, time=time):
        self.tweet_id = tweet_id
        self.place = place
        self.text = text
        self.time = time