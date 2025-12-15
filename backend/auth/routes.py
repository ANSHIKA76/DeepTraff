import random
import time
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient

from auth.models import (
    UserCreate,
    UserLogin,
    VerifyOTP,
    ForgotPassword,
    ResetPassword,
)

from auth.utils import (
    hash_password,
    verify_password,
    create_jwt,
)

from email_service import send_otp_email
from settings import settings   # <-- Load from .env

# ================================================================
# 🔗 MONGODB CONNECTION (from .env)
# ================================================================
client = AsyncIOMotorClient(settings.mongodb_uri)
db = client["vehicle_app"]
users = db["users"]

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


# ================================================================
# 🧩 SIGNUP — CREATE USER + SEND OTP
# ================================================================
@auth_router.post("/signup")
async def signup(data: UserCreate):
    existing = await users.find_one({"email": data.email})
    if existing:
        raise HTTPException(400, "User already exists")

    otp = str(random.randint(100000, 999999))

    await users.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "verified": False,
        "otp": otp,
        "otp_expire": time.time() + 300,  # 5 minutes
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    })

    send_otp_email(data.email, otp)

    return {"status": "otp_sent", "message": "OTP sent to email"}


# ================================================================
# 🔐 VERIFY OTP
# ================================================================
@auth_router.post("/verifyOTP")
async def verify_otp(data: VerifyOTP):
    user = await users.find_one({"email": data.email})
    if not user:
        raise HTTPException(404, "User not found")

    if user.get("otp") != data.otp:
        raise HTTPException(400, "Invalid OTP")

    if time.time() > user.get("otp_expire", 0):
        raise HTTPException(400, "OTP expired")

    await users.update_one(
        {"email": data.email},
        {"$set": {"verified": True}, "$unset": {"otp": "", "otp_expire": ""}}
    )

    return {"status": "success", "message": "Account verified successfully"}


# ================================================================
# 🔑 LOGIN (FORM DATA FOR FASTAPI DOCS)
# ================================================================
@auth_router.post("/login")
async def login(form: OAuth2PasswordRequestForm = Depends()):
    email = form.username
    password = form.password

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_password(password, user["password"]):
        raise HTTPException(400, "Wrong password")

    if not user.get("verified", False):
        raise HTTPException(401, "Account not verified")

    token = create_jwt({"sub": str(user["_id"])})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer"
    }


# ================================================================
# 🔑 LOGIN (JSON FOR REACT)
# ================================================================
@auth_router.post("/login-json")
async def login_json(data: UserLogin):
    user = await users.find_one({"email": data.email})
    if not user:
        raise HTTPException(404, "User not found")

    if not verify_password(data.password, user["password"]):
        raise HTTPException(400, "Wrong password")

    if not user.get("verified", False):
        raise HTTPException(401, "Account not verified")

    token = create_jwt({"sub": str(user["_id"])})

    return {
        "status": "success",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "name": user["name"],
            "email": user["email"]
        }
    }


# ================================================================
# 🔁 FORGOT PASSWORD — GENERATE OTP
# ================================================================
@auth_router.post("/forgotPassword")
async def forgot_password(data: ForgotPassword):
    user = await users.find_one({"email": data.email})
    if not user:
        raise HTTPException(404, "User not found")

    otp = str(random.randint(100000, 999999))

    await users.update_one(
        {"email": data.email},
        {"$set": {"otp": otp, "otp_expire": time.time() + 300}}
    )

    send_otp_email(data.email, otp)

    return {"status": "otp_sent", "message": "OTP sent to email"}


# ================================================================
# 🔄 RESET PASSWORD
# ================================================================
@auth_router.post("/resetPassword")
async def reset_password(data: ResetPassword):
    user = await users.find_one({"email": data.email})
    if not user:
        raise HTTPException(404, "User not found")

    if user.get("otp") != data.otp:
        raise HTTPException(400, "Invalid OTP")

    if time.time() > user.get("otp_expire", 0):
        raise HTTPException(400, "OTP expired")

    await users.update_one(
        {"email": data.email},
        {
            "$set": {"password": hash_password(data.new_password)},
            "$unset": {"otp": "", "otp_expire": ""}
        }
    )

    return {"status": "success", "message": "Password reset successfully"}
