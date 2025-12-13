import time
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt

# ================================
# 🔐 PASSWORD HASHING
# ================================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(raw: str, hashed: str) -> bool:
    return pwd_context.verify(raw, hashed)


# ================================
# 🔑 JWT TOKEN
# ================================
SECRET_KEY = "CHANGE_THIS_SECRET"   # change before deployment
ALGORITHM = "HS256"
ACCESS_EXPIRE_MINUTES = 60

def create_jwt(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_EXPIRE_MINUTES)
    data.update({"exp": expire})
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def decode_jwt(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None
