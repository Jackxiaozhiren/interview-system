from datetime import timedelta
from typing import Annotated
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import JWTError, jwt

from app.db import get_db
from app.models.entities import UserORM
from app.models.schemas import UserCreate, User, Token
from app.core.security import verify_password, get_password_hash, create_access_token, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.config import settings

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(UserORM).filter(UserORM.email == email).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Annotated[UserORM, Depends(get_current_user)]):
    if current_user.is_active != 1:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

@router.post("/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserORM).filter(UserORM.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    verification_token = str(uuid.uuid4())
    
    new_user = UserORM(
        id=str(uuid.uuid4()),
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name,
        is_active=1,
        is_verified=0,
        verification_token=verification_token
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Mock sending email
    print(f"--------------------------------------------------")
    print(f"EMAIL SENT TO: {user.email}")
    print(f"SUBJECT: Verify your email")
    print(f"CONTENT: Click here to verify: http://localhost:3000/verify?token={verification_token}")
    print(f"--------------------------------------------------")
    
    return new_user

@router.post("/verify-email")
def verify_email(token: str, db: Session = Depends(get_db)):
    user = db.query(UserORM).filter(UserORM.verification_token == token).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    
    if user.is_verified:
        return {"message": "Email already verified"}
        
    user.is_verified = 1
    user.verification_token = None # Optional: clear token after use
    db.commit()
    
    return {"message": "Email verified successfully"}

@router.get("/login/{provider}")
async def login_via_provider(provider: str):
    if provider not in ["github", "google", "wechat"]:
        raise HTTPException(status_code=400, detail="Invalid provider")
    
    if settings.MOCK_MODE:
        return {"url": f"http://localhost:3000/mock/login?provider={provider}"}
    
    # Real OAuth logic would go here (using authlib)
    return {"url": f"https://{provider}.com/oauth/authorize?..."}

@router.get("/callback/{provider}")
async def oauth_callback(provider: str, code: str, db: Session = Depends(get_db)):
    if settings.MOCK_MODE:
        # Mock user data based on provider
        email = f"mock_{provider}_user@example.com"
        full_name = f"Mock {provider.capitalize()} User"
        
        # Check if user exists, if not create
        user = db.query(UserORM).filter(UserORM.email == email).first()
        if not user:
            user = UserORM(
                id=str(uuid.uuid4()),
                email=email,
                hashed_password=get_password_hash("mock_password"), # Dummy password
                full_name=full_name,
                is_active=1,
                is_verified=1
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email}, expires_delta=access_token_expires
        )
        return {"access_token": access_token, "token_type": "bearer"}

    # Real OAuth callback logic would go here
    return {"error": "Real OAuth not implemented yet"}

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Session = Depends(get_db)
):
    print(f"Login attempt: username={repr(form_data.username)}, password={repr(form_data.password)}")
    user = db.query(UserORM).filter(UserORM.email == form_data.username).first()
    if user:
        print(f"User found: {user.email}, hash={repr(user.hashed_password)}")
        is_valid = verify_password(form_data.password, user.hashed_password)
        print(f"Password valid: {is_valid}")
    else:
        print("User not found")
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/users/me", response_model=User)
async def read_users_me(current_user: Annotated[UserORM, Depends(get_current_active_user)]):
    return current_user
