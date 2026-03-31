# ========== Stage 1: Build 階段 ==========
# 使用 node 官方映像檔作為建置環境
FROM node:20-alpine AS builder

# 設定工作目錄
WORKDIR /app

# 先複製 package.json 以利用 Docker 快取機制
COPY package*.json ./

# 安裝套件
RUN npm install

# 複製所有原始碼 (會略過 .dockerignore 裡的檔案)
COPY . .

# 打包成靜態檔案 (產出會放在 /app/dist)
RUN npm run build


# ========== Stage 2: Production 階段 ==========
# 使用超輕量級的 Nginx 伺服器
FROM nginx:alpine

# 把第一階段打包好的靜態檔案，複製到 Nginx 的預設網頁目錄
COPY --from=builder /app/dist /usr/share/nginx/html

# (進階設定) 覆寫 Nginx 設定檔，讓 React Router 的 SPA 路由不會報錯 (404)
RUN sed -i '10i \\t\ttry_files $uri $uri/ /index.html;' /etc/nginx/conf.d/default.conf

# 暴露 80 port
EXPOSE 80

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]