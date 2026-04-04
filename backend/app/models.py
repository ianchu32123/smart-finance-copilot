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

    transactions = relationship("Transaction", back_populates="category")


class Transaction(Base):
    __tablename__ = 'transactions'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete="CASCADE"), nullable=False)
    category_id = Column(Integer, ForeignKey('categories.id'), nullable=True)
    is_anomaly = Column(Boolean, default=False)
    # 面試亮點：使用 Numeric(10, 2) 確保財務數據的精度，避免 Float 的浮點數誤差
    amount = Column(Numeric(10, 2), nullable=False)
    transaction_date = Column(Date, nullable=False)
    description = Column(String(255))
    raw_text_input = Column(Text)
    is_ai_parsed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 建立關聯
    user = relationship("User", back_populates="transactions")
    category = relationship("Category", back_populates="transactions")
    anomaly = relationship("Anomaly", back_populates="transaction", uselist=False) # 一對一關聯

    # 面試亮點：複合索引 (Composite Index)
    # 針對最常查詢的「某個使用者在特定時間段的花費」進行效能優化
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