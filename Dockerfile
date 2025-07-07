# 构建阶段
#FROM node:18 AS builder
#WORKDIR /app

# 复制 package.json 及锁文件并安装依赖
#COPY package.json package-lock.json* ./
#RUN npm install

# 复制其余文件并构建
#COPY . .
#RUN npm run build

# 运行阶段：使用 nginx 提供静态文件
#FROM nginx:alpine
# 删除默认配置
#RUN rm /etc/nginx/conf.d/default.conf
# 复制自定义 nginx 配置
#COPY nginx.conf /etc/nginx/conf.d/

# 将 build 产物拷贝到 nginx 的静态目录
#COPY --from=builder /app/dist/. /usr/share/nginx/html/

#EXPOSE 80
#CMD ["nginx", "-g", "daemon off;"]
FROM node:18 AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
# 把默认的 html 全部清空
RUN rm -rf /usr/share/nginx/html/*

# 直接把 dist 下所有文件（index.html、assets、favicon.ico…）都拷到根目录
COPY --from=builder /app/dist/. /usr/share/nginx/html/

# 如果你有 nginx.conf 配置，也一并拷过去
# COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
