from pydantic import BaseSettings, Field

class Settings(BaseSettings):
    # MongoDB
    mongodb_uri: str = Field(..., env="MONGODB_URI")

    # Security / debug flags
    secret_key: str = Field("change-me-in-prod", env="SECRET_KEY")
    debug: bool = Field(False, env="DEBUG")

    # Email
    email_sender: str = Field(..., env="EMAIL_SENDER")
    email_app_password: str = Field(..., env="EMAIL_APP_PASSWORD")

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
