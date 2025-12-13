from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from settings import settings

_mongo_client: Optional[AsyncIOMotorClient] = None
_db = None

def init_db():
    """
    Initialize the global Mongo client and database.
    Call this once at application startup.
    """
    global _mongo_client, _db
    if _mongo_client is None:
        _mongo_client = AsyncIOMotorClient(settings.mongodb_uri)
        # get_default_database uses the DB from the URI if present; otherwise adjust as needed
        try:
            _db = _mongo_client.get_default_database()
        except Exception:

            _db = _mongo_client["vehicle_app"]
    return _db

def get_db():
    """
    Return the initialized database instance. Ensure init_db() has been called.
    """
    if _db is None:
        return init_db()
    return _db
