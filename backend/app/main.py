import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
# 匯入我們寫好的資料庫連線設定
from app.database import get_db, engine, Base
from app.auth import get_password_hash, verify_password, create_access_token
from datetime import datetime, timedelta
from sqlalchemy import func
# 新增這些匯入
from passlib.context import CryptContext
from app import models, schemas

from datetime import date
from app.services.llm import parse_transaction_with_llm  # 匯入你的 AI 大腦
# 設定密碼加密工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 部署時讓資料表自動建立（demo 用，正式上線請改用 Alembic migration）
Base.metadata.create_all(bind=engine)

# 初始化 FastAPI 應用程式
app = FastAPI(
    title="Smart Finance Copilot API",
    description="結合 AI 的個人智慧記帳與異常花費偵測系統",
    version="1.0.0"
)

# CORS 來源：本地開發 + 部署環境（用環境變數注入正式網域，逗號分隔可多個）
default_origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
extra_origins = [o.strip() for o in os.getenv("FRONTEND_URL", "").split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=default_origins + extra_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Finance Copilot API"}

# 給 Render 做 health check 用：不查 DB，避免冷啟動時誤殺 service
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# 進階檢查：含 DB 連線狀態，給人手動點開看用
@app.get("/api/health/db")
def health_check_db(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "message": "FastAPI 成功連線到 PostgreSQL！"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database connection failed: {str(e)}")
    

# 面試亮點：標準的 RESTful API 設計與密碼加密實踐
@app.post("/api/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. 檢查信箱是否已經被註冊過
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. 將前端傳來的密碼進行加密 (Hash)
    hashed_password = pwd_context.hash(user.password)
    
    # 3. 建立 SQLAlchemy Model 實例
    new_user = models.User(
        username=user.username, 
        email=user.email, 
        password_hash=hashed_password
    )

    # 4. 寫入資料庫
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 5. 回傳結果 (FastAPI 會自動根據 schemas.UserResponse 幫我們過濾掉密碼)
    return new_user

# 面試亮點：結合 LLM 與資料庫自動化處理的 Endpoint
@app.post("/api/transactions/ai", response_model=schemas.TransactionResponse)
def create_transaction_via_ai(payload: schemas.TransactionAIText, db: Session = Depends(get_db)):
    # 1. 呼叫假 AI 解析文字 (之後會換成真實 LLM)
    parsed_data = parse_transaction_with_llm(payload.text)

    # 📊 2. 異常偵測核心邏輯：計算過去 7 天平均花費
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    avg_amount = db.query(func.avg(models.Transaction.amount))\
                   .filter(models.Transaction.user_id == payload.user_id)\
                   .filter(models.Transaction.transaction_date >= seven_days_ago.date())\
                   .scalar() or 0

    # 🚨 3. 判定條件：大於平均值 2 倍 (且平均值大於 0 避免除以零的邏輯錯誤)
    amount_float = float(parsed_data["amount"])
    is_anomaly = amount_float > (float(avg_amount) * 2) if avg_amount > 0 else False

    # 4. 存入資料庫
    # ... 前面的平均值計算邏輯不變 ...

    # 4. 存入資料庫
    new_tx = models.Transaction(
        user_id=payload.user_id,
        amount=amount_float,
        description=parsed_data["description"],
        transaction_date=datetime.utcnow().date(), # 📍 補上這行！給它當天的日期
        is_ai_parsed=True,
        is_anomaly=is_anomaly,
        category_name=parsed_data.get("category", "其他"),
        transaction_type=parsed_data.get("type", "expense") # 📍 補上這行
    )
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)
    return new_tx

    # 4. 回傳漂亮的結果給前端
    return {
        "message": "AI 記帳成功！",
        "parsed_data": parsed_data,
        "transaction_id": new_tx.id
    }

# 面試亮點：RESTful GET 方法與 SQLAlchemy 查詢
@app.get("/api/transactions/{user_id}", response_model=list[schemas.TransactionResponse])
def get_user_transactions(user_id: str, db: Session = Depends(get_db)):
    # 透過 filter 撈出該 user_id 底下的所有交易紀錄，並依照日期由新到舊排序
    transactions = db.query(models.Transaction)\
                     .filter(models.Transaction.user_id == user_id)\
                     .order_by(models.Transaction.transaction_date.desc())\
                     .all()
    
    # 如果找不到資料，回傳空陣列是比較好的前端工程實踐，而不是報錯
    return transactions

# ==========================================
# 🛡️ 註冊與登入 API
# ==========================================
@app.post("/api/users/register", response_model=schemas.Token)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 檢查信箱是否被註冊過
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="此 Email 已經註冊過了！")
    
    # 建立新使用者 (把密碼加密後再存)
    hashed_pwd = get_password_hash(user.password)
    
    # 📍 這裡修改：把 username 補上！保險起見把兩個 password 欄位都塞入加密密碼
    new_user = models.User(
        username=user.username,
        email=user.email, 
        hashed_password=hashed_pwd,
        password_hash=hashed_pwd 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 發放 JWT 通行證
    access_token = create_access_token(data={"sub": str(new_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": str(new_user.id)}

@app.post("/api/users/login", response_model=schemas.Token)
def login_user(user: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. 找看看有沒有這個人
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user:
        raise HTTPException(status_code=400, detail="信箱或密碼錯誤")
    
    # 2. 驗證密碼對不對
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="信箱或密碼錯誤")
    
    # 3. 登入成功，發放 JWT 通行證
    access_token = create_access_token(data={"sub": str(db_user.id)})
    return {"access_token": access_token, "token_type": "bearer", "user_id": str(db_user.id)}


# 🗑️ 刪除交易紀錄 API
@app.delete("/api/transactions/{transaction_id}")
def delete_transaction(transaction_id: str, db: Session = Depends(get_db)):
    tx = db.query(models.Transaction).filter(models.Transaction.id == transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="找不到此筆交易")
    db.delete(tx)
    db.commit()
    return {"message": "刪除成功"}