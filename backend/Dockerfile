# 使用輕量級的 Python 3.13 映像檔
FROM python:3.13-slim

WORKDIR /app

# 先複製套件清單並安裝，利用 Docker 快取加速
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製所有後端程式碼
COPY . .

# 暴露 8000 Port
EXPOSE 8000

# 啟動 FastAPI 伺服器 (注意這裡要把 host 設為 0.0.0.0 才能對外開放)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]