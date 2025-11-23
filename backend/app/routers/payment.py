from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from datetime import datetime

from app.db import get_db
from app.models.entities import PaymentPackageORM, OrderORM, UserORM
from app.models.schemas import PaymentPackage, Order, OrderCreate
from app.routers.auth import get_current_active_user

router = APIRouter(
    prefix="/payment",
    tags=["payment"]
)

@router.get("/packages", response_model=List[PaymentPackage])
async def list_packages(db: Session = Depends(get_db)):
    """List all available payment packages."""
    packages = db.query(PaymentPackageORM).all()
    
    # Seed default packages if none exist
    if not packages:
        default_packages = [
            PaymentPackageORM(
                id=str(uuid.uuid4()),
                name="Entry",
                description="Start your first AI interview practice.",
                price=990, # 9.90 CNY
                features="100 Credits (Valid 1 Month),Basic AI Feedback,Standard Support,Community Access"
            ),
            PaymentPackageORM(
                id=str(uuid.uuid4()),
                name="Standard",
                description="Accelerate your interview preparation.",
                price=1990, # 19.90 CNY
                features="200 Credits (Valid 3 Months),Advanced AI Coaching,Detailed Analytics,Priority Support,Resume Analysis"
            ),
            PaymentPackageORM(
                id=str(uuid.uuid4()),
                name="Premium",
                description="Ultimate preparation for your dream job.",
                price=2990, # 29.90 CNY
                features="300 Credits (Valid 1 Year),Unlimited AI Interviews,1-on-1 Expert Review,24/7 Priority Support,All Future Updates"
            )
        ]
        db.add_all(default_packages)
        db.commit()
        packages = db.query(PaymentPackageORM).all()
        
    return packages

@router.post("/orders", response_model=Order)
async def create_order(
    order_in: OrderCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """Create a new order for a package."""
    package = db.get(PaymentPackageORM, order_in.package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
        
    order_id = str(uuid.uuid4())
    order = OrderORM(
        id=order_id,
        user_id=current_user.id,
        package_id=package.id,
        amount=package.price,
        status="paid", # Mock payment: immediately paid
        created_at=datetime.utcnow()
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order

@router.get("/orders", response_model=List[Order])
async def list_orders(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user)
):
    """List all orders for the current user."""
    return db.query(OrderORM).filter(OrderORM.user_id == current_user.id).all()

from app.core.config import settings
from app.models.schemas import User

@router.post("/create/alipay")
async def create_alipay_order(package_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    package = db.query(PaymentPackageORM).filter(PaymentPackageORM.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    new_order = OrderORM(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        package_id=package_id,
        amount=package.price,
        status="pending",
        payment_method="alipay",
        created_at=datetime.utcnow()
    )
    db.add(new_order)
    db.commit()

    if settings.MOCK_MODE:
        return {"payment_url": f"http://localhost:3000/mock/payment?method=alipay&order_id={new_order.id}&amount={package.price}"}
    
    # Real Alipay logic would go here
    return {"payment_url": "https://openapi.alipay.com/gateway.do?..."}

@router.post("/create/wechat")
async def create_wechat_order(package_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    package = db.query(PaymentPackageORM).filter(PaymentPackageORM.id == package_id).first()
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")

    new_order = OrderORM(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        package_id=package_id,
        amount=package.price,
        status="pending",
        payment_method="wechat",
        created_at=datetime.utcnow()
    )
    db.add(new_order)
    db.commit()

    if settings.MOCK_MODE:
        return {"payment_url": f"http://localhost:3000/mock/payment?method=wechat&order_id={new_order.id}&amount={package.price}"}
    
    # Real WeChat Pay logic would go here
    return {"payment_url": "weixin://wxpay/bizpayurl?..."}

@router.post("/notify/mock")
async def mock_payment_notify(order_id: str, db: Session = Depends(get_db)):
    order = db.query(OrderORM).filter(OrderORM.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = "completed"
    db.commit()
    return {"status": "success"}
