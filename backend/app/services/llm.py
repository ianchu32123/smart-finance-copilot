import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# 載入 .env 檔案裡的環境變數
load_dotenv()

# 初始化 OpenAI 客戶端 (會自動讀取 os.environ.get("OPENAI_API_KEY"))
client = OpenAI()

def parse_transaction_with_llm(user_input: str) -> dict:
    """
    (Mock 模式) 暫時不呼叫 OpenAI，直接回傳假資料來測試資料庫邏輯。
    面試時可以說：「為了不依賴外部服務並節省開發成本，我實作了 Mock 機制來做單元測試。」
    """
    print(f"✅ 成功收到前端傳來的文字: {user_input}")
    print("🤖 (假裝思考中...) 正在解析為 JSON...")
    
    # 直接回傳一組固定的完美資料
    return {
        "amount": 1200,
        "description": "海底撈",
        "category": "飲食",
        "type": "expense"
    }