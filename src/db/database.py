from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from environs import Env


env = Env()
env.read_env()

POSTGRES_USER = env.str("POSTGRES_USER")
POSTGRES_PASSWORD = env.str("POSTGRES_PASSWORD")
POSTGRES_HOSTNAME = env.str("POSTGRES_HOSTNAME")
POSTGRES_PORT = env.str("POSTGRES_PORT")
POSTGRES_DB = env.str("POSTGRES_DB")
SQLALCHEMY_DATABASE_URI = (
    f"postgresql+psycopg2://{POSTGRES_USER}:{POSTGRES_PASSWORD}"
    f"@{POSTGRES_HOSTNAME}/{POSTGRES_DB}"
)

engine = create_engine(SQLALCHEMY_DATABASE_URI)

db_session = scoped_session(sessionmaker(autocommit=False,
                                         autoflush=False,
                                         bind=engine))
Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    from .models import User
    Base.metadata.create_all(bind=engine)
