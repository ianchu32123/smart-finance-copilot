from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os
from sqlalchemy.orm import  declarative_base

# 如果有設定環境變數就用環境變數(Docker用)，沒有的話就用本機的預設值
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+psycopg://root:rootpassword@db:5432/smart_finance"
)

#engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 這是連線到你 Docker PostgreSQL 的字串
# 格式：postgresql://帳號:密碼@主機:Port/資料庫名稱
#SQLALCHEMY_DATABASE_URL = "postgresql+psycopg://finance_admin:secure_password_123@localhost:5432/smart_finance"

# 建立資料庫引擎
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# 建立 SessionLocal 類別，用來在 API 中產生資料庫的 Session (對話)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立 Base 類別，我們的 Models 都會繼承它
Base = declarative_base()

# 取得資料庫連線的 Dependency (供 FastAPI 路由使用)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()