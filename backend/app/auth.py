from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt

# 密碼加密設定 (使用 bcrypt 演算法)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT 設定 (實務上 SECRET_KEY 應該放在 .env 裡，這邊先寫死方便測試)
SECRET_KEY = "super-secret-smart-finance-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 通行證有效期限：1天

# 1. 將明文密碼加密
def get_password_hash(password: str):
    return pwd_context.hash(password)

# 2. 驗證密碼是否正確
def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# 3. 製作 JWT 通行證
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt