import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Boolean, Date, DateTime, ForeignKey, Text, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy import Boolean

from sqlalchemy.orm import relationship
from app.database import Base  # 📍 加上這行，讓它使用 database.py 裡面的 Base

class User(Base):
    __tablename__ = 'users'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(String(50), nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    hashed_password = Column(String, nullable=False, server_default="default_hash")
    # 建立與 Transaction 的關聯 (一對多)
    transactions = relationship("Transaction", back_populates="user", cascade="all, delete-orphan")
    anomalies = relationship("Anomaly", back_populates="user", cascade="all, delete-orphan")


class Category(Base):
    __tablename__ = 'categories'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(20), nullable=False)  # 'income' 或 'expense'

    transactions = relationship("Transaction", back_populates="category_ref")


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    # 📍 1. 資料表關聯用的 ID
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    
    is_anomaly = Column(Boolean, default=False)
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(String(255))
    raw_text_input = Column(Text)
    is_ai_parsed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    transaction_type = Column(String, nullable=False, server_default="expense")
    
    # 📍 2. 給 AI 專用的字串分類 (把原本多餘的 category 刪除，只留這個)
    category_name = Column(String, server_default="其他")

    # 📍 3. 建立關聯 (請確認 category_name 的 relationship 已經被刪掉了！)
    category_ref = relationship("Category", back_populates="transactions")
    user = relationship("User", back_populates="transactions")
    anomaly = relationship("Anomaly", back_populates="transaction", uselist=False)

    __table_args__ = (
        Index('ix_transactions_user_date', 'user_id', 'transaction_date'),
    )

class Anomaly(Base):
    __tablename__ = 'anomalies'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey('transactions.id', ondelete="CASCADE"), unique=True, nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    
    anomaly_score = Column(Numeric(5, 4)) # AI 算出的異常分數 (例如 0.9521)
    reason = Column(Text)
    status = Column(String(20), default='pending') # pending, confirmed, false_positive
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    # 建立關聯
    transaction = relationship("Transaction", back_populates="anomaly")
    user = relationship("User", back_populates="anomalies")