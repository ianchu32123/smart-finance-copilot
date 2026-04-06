import os
import json
import google.generativeai as genai

def parse_transaction_with_llm(text: str) -> dict:
    """
    將使用者輸入的自然語言，交由 Gemini 解析成結構化的 JSON 資料
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("未設定 GEMINI_API_KEY 環境變數！")
    
    genai.configure(api_key=api_key)
    
    # 💡 升級：自動向 Google 查詢目前可用的模型清單
    available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
    print(f"🔍 後端偵測到的可用模型: {available_models}") # 印在 Docker log 方便除錯
    
    # 自動挑選名稱中帶有 'flash' 的模型，如果都沒找到，就用最保守的 'gemini-1.5-flash-latest'
    target_model_name = 'gemini-1.5-flash-latest'
    for m in available_models:
        if 'flash' in m:
            # list_models 回傳的名稱通常帶有 'models/' 前綴，GenerativeModel 不需要這個前綴
            target_model_name = m.replace('models/', '') 
            break
            
    print(f"🤖 最終決定喚醒的 AI 模型: {target_model_name}")
    model = genai.GenerativeModel(target_model_name)
    
    prompt = f"""
    你是一個專業的理財助手。請從以下使用者輸入的文字中，提取出「花費金額」與「消費項目」。
    請務必嚴格遵守以下規則：
    1. 只能回傳乾淨的 JSON 格式，絕對不要包含任何 Markdown 標記 (例如 ```json) 或其他說明文字。
    2. JSON 必須包含兩個欄位：
       - "amount": 整數 (例如: 150)
       - "description": 字串，盡量精簡 (例如: "大潤發日常用品")
       - "type": 字串，只能填寫 "expense" (代表支出) 或 "income" (代表收入)
    
    使用者輸入：{text}
    """
    
    try:
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                temperature=0.1 
            )
        )
        result = json.loads(response.text)
        return result
        
    except Exception as e:
        print(f"🔥 LLM 解析失敗: {e}")
        # 📍 防呆機制也要補上 type
        return {"amount": 0, "description": "無法解析的記帳內容", "type": "expense"}