from pydantic import BaseModel, EmailStr


# ------------------ SIGNUP ------------------
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


# ------------------ LOGIN ------------------
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ------------------ VERIFY OTP ------------------
class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str


# ------------------ FORGOT PASSWORD ------------------
class ForgotPassword(BaseModel):
    email: EmailStr


# ------------------ RESET PASSWORD ------------------
class ResetPassword(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
