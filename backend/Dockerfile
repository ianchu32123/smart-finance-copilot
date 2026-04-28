# 使用輕量級的 Python 3.13 映像檔
FROM python:3.13-slim

WORKDIR /app

# 先複製套件清單並安裝，利用 Docker 快取加速
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製所有後端程式碼
COPY . .

# 暴露 Port (Render 會以 $PORT 注入；本地預設 8000)
EXPOSE 8000

# 用 shell 形式 CMD 才能展開 ${PORT}（Render 會把 web service 的 port 塞進來）
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}