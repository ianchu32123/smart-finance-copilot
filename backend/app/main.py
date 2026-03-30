from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
# 匯入我們寫好的資料庫連線設定
from app.database import get_db

# 新增這些匯入
from passlib.context import CryptContext
from app import models, schemas

from datetime import date
from app.services.llm import parse_transaction_with_llm  # 匯入你的 AI 大腦
# 設定密碼加密工具
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 初始化 FastAPI 應用程式
app = FastAPI(
    title="Smart Finance Copilot API",
    description="結合 AI 的個人智慧記帳與異常花費偵測系統",
    version="1.0.0"
)

# 設定 CORS (跨來源資源共用)
# 這非常重要，因為之後你的 React 前端 (Port 5173) 會呼叫這個後端 (Port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發階段先允許所有網域連線，上線部署時會改掉
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to Smart Finance Copilot API"}

# 面試亮點：Health Check Endpoint
@app.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    try:
        # 嘗試對資料庫執行一個最簡單的查詢，確認連線是否暢通
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy", 
            "database": "connected",
            "message": "FastAPI 成功連線到 PostgreSQL！"
        }
    except Exception as e:
        # 如果連線失敗，回傳 500 錯誤與詳細原因
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
@app.post("/api/transactions/ai")
def create_transaction_via_ai(payload: schemas.TransactionAIText, db: Session = Depends(get_db)):
    # 1. 將使用者的文字丟給 OpenAI 進行解析
    parsed_data = parse_transaction_with_llm(payload.text)
    
    # 防呆機制：如果 AI 解析失敗或 API Key 有問題
    if not parsed_data:
        raise HTTPException(status_code=400, detail="AI 無法解析這段文字，請確認 OpenAI API 狀態或換個說法！")

    # 2. 處理分類 (Category) - 展現你的關聯式資料庫思維
    category_name = parsed_data.get("category", "其他")
    category_type = parsed_data.get("type", "expense")

    # 在資料庫找找看有沒有這個分類，沒有的話就「自動建一個」，這在實務上非常實用
    db_category = db.query(models.Category).filter(models.Category.name == category_name).first()
    if not db_category:
        db_category = models.Category(name=category_name, type=category_type)
        db.add(db_category)
        db.commit()
        db.refresh(db_category)

    # 3. 建立並寫入交易紀錄 (Transaction)
    new_tx = models.Transaction(
        user_id=payload.user_id,
        category_id=db_category.id,
        amount=parsed_data.get("amount", 0),
        description=parsed_data.get("description", ""),
        transaction_date=date.today(), # 預設記在今天
        raw_text_input=payload.text,   # 保留原始輸入，這對未來微調 (Fine-tuning) AI 模型非常重要！
        is_ai_parsed=True
    )
    
    db.add(new_tx)
    db.commit()
    db.refresh(new_tx)

    # 4. 回傳漂亮的結果給前端
    return {
        "message": "AI 記帳成功！",
        "parsed_data": parsed_data,
        "transaction_id": new_tx.id
    }