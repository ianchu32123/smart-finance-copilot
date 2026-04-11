from pydantic import BaseModel
from uuid import UUID
from datetime import datetime,date

# 前端傳送過來的資料格式 (註冊時)
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

# 後端回傳給前端的資料格式 (隱藏密碼，只回傳安全資訊)
class UserResponse(BaseModel):
    id: UUID
    username: str
    email: str
    created_at: datetime

    # 這個設定讓 Pydantic 可以自動讀取 SQLAlchemy Model 的資料
    class Config:
        from_attributes = True
# 處理 AI 記帳請求的格式
class TransactionAIText(BaseModel):
    user_id: UUID  # 需要知道是哪個使用者記的帳
    text: str      # 使用者輸入的自然語言，例如 "今天吃麥當勞花 150"

# 交易紀錄的回傳格式
class TransactionResponse(BaseModel):
    id: UUID
    amount: float
    description: str | None = None
    is_ai_parsed: bool
    transaction_date: date
    is_anomaly: bool = False
    transaction_type: str = "expense"
    category_name: str = "其他"  # 📍 新增這行

    class Config:
        from_attributes = True

# 📍 請在檔案找個合適的地方貼上這些類別
class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str