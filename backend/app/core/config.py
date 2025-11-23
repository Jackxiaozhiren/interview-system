import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # ... existing settings ...
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Mock Mode
    MOCK_MODE: bool = os.getenv("MOCK_MODE", "True").lower() == "true"

    # Alipay
    ALIPAY_APPID: Optional[str] = os.getenv("ALIPAY_APPID")
    ALIPAY_PRIVATE_KEY: Optional[str] = os.getenv("ALIPAY_PRIVATE_KEY")
    ALIPAY_PUBLIC_KEY: Optional[str] = os.getenv("ALIPAY_PUBLIC_KEY")
    ALIPAY_DEBUG: bool = True

    # WeChat Pay
    WECHAT_MCHID: Optional[str] = os.getenv("WECHAT_MCHID")
    WECHAT_PRIVATE_KEY: Optional[str] = os.getenv("WECHAT_PRIVATE_KEY")
    WECHAT_CERT_SERIAL_NO: Optional[str] = os.getenv("WECHAT_CERT_SERIAL_NO")
    WECHAT_APIV3_KEY: Optional[str] = os.getenv("WECHAT_APIV3_KEY")
    WECHAT_APPID: Optional[str] = os.getenv("WECHAT_APPID")

    # OAuth
    GITHUB_CLIENT_ID: Optional[str] = os.getenv("GITHUB_CLIENT_ID")
    GITHUB_CLIENT_SECRET: Optional[str] = os.getenv("GITHUB_CLIENT_SECRET")
    
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    
    WECHAT_LOGIN_APPID: Optional[str] = os.getenv("WECHAT_LOGIN_APPID")
    WECHAT_LOGIN_SECRET: Optional[str] = os.getenv("WECHAT_LOGIN_SECRET")

    class Config:
        env_file = ".env"

settings = Settings()
