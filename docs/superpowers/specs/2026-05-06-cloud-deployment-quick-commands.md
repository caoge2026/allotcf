# AllôTCF 云端部署最短执行版

> 状态：执行清单
> 日期：2026-05-06

适用前提：

- 应用服务器：`47.94.88.161`，Alibaba Cloud Linux 4，`2C2G`，`40 GiB`
- 数据库服务器：`47.92.55.242`，Windows Server 2022，`2C2G`，`20 GiB`
- 数据库服务器已安装 `MySQL 5.7`
- 数据库迁移方式：`整库迁移`

## 1. 本地机器执行

### 1.1 构建前端

```bash
cd /Users/miao/my_project/allotcf/frontend
npm install
npm run build
```

### 1.2 打包后端

```bash
cd /Users/miao/my_project/allotcf/backend
mvn clean package -DskipTests
```

### 1.3 导出整库

```bash
mysqldump -u root -p123456 --databases allo --default-character-set=utf8mb4 > /Users/miao/my_project/allotcf/allo_full.sql
```

### 1.4 上传数据库导出文件到 Windows 数据库服务器

用你习惯的方式上传到：

- `C:\deploy\allo_full.sql`

### 1.5 上传应用文件到 Linux 应用服务器

```bash
scp -r /Users/miao/my_project/allotcf/frontend/dist/* root@47.94.88.161:/var/www/allotcf/
scp /Users/miao/my_project/allotcf/backend/target/allotcf-0.0.1-SNAPSHOT.jar root@47.94.88.161:/opt/allotcf/backend/
scp /Users/miao/my_project/allotcf/nginx.conf root@47.94.88.161:/etc/nginx/conf.d/allotcf.conf
```

## 2. Windows 数据库服务器执行

### 2.1 确认 MySQL 版本

```powershell
mysql --version
```

### 2.2 创建应用账号

```sql
CREATE USER 'allotcf_app'@'47.94.88.161' IDENTIFIED BY '请改成强密码';
GRANT ALL PRIVILEGES ON allo.* TO 'allotcf_app'@'47.94.88.161';
FLUSH PRIVILEGES;
```

### 2.3 导入整库

```powershell
mysql -u root -p < C:\deploy\allo_full.sql
```

### 2.4 Windows 防火墙放通 3306，仅允许应用服务器

在防火墙里添加：

- 端口：`3306`
- 协议：`TCP`
- 来源：`47.94.88.161`

## 3. Linux 应用服务器执行

### 3.1 安装 Java 17 和 Nginx

```bash
sudo dnf update -y
sudo dnf install -y java-17-alibaba-dragonwell-headless nginx
sudo systemctl enable nginx
sudo systemctl start nginx
java -version
nginx -v
```

### 3.2 创建目录

```bash
sudo mkdir -p /opt/allotcf/backend
sudo mkdir -p /etc/allotcf
sudo mkdir -p /var/www/allotcf
sudo chown -R $USER:$USER /opt/allotcf/backend /etc/allotcf
sudo chown -R nginx:nginx /var/www/allotcf
```

### 3.3 写生产配置

创建：

- `/etc/allotcf/application-prod.yml`

内容：

```yaml
spring:
  datasource:
    url: jdbc:mysql://47.92.55.242:3306/allo?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: allotcf_app
    password: 请改成你的强密码
    driver-class-name: com.mysql.cj.jdbc.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    database-platform: org.hibernate.dialect.MySQLDialect

jwt:
  secret: 请改成至少32位的随机强密钥
  expiration: 86400000

server:
  port: 8080
```

生成 JWT secret：

```bash
openssl rand -base64 48
```

### 3.4 写 systemd 服务

创建：

- `/etc/systemd/system/allotcf.service`

内容：

```ini
[Unit]
Description=AllotCF Spring Boot Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/allotcf/backend
ExecStart=/usr/bin/java -Xms256m -Xmx768m -jar /opt/allotcf/backend/allotcf-0.0.1-SNAPSHOT.jar --spring.config.location=file:/etc/allotcf/application-prod.yml
SuccessExitStatus=143
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 3.5 启动后端

```bash
sudo systemctl daemon-reload
sudo systemctl enable allotcf
sudo systemctl start allotcf
sudo systemctl status allotcf
```

查看日志：

```bash
journalctl -u allotcf -f
```

### 3.6 启动 Nginx

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 4. 验收

### 4.1 在应用服务器上

```bash
curl http://127.0.0.1:8080
curl http://127.0.0.1
```

### 4.2 在本地浏览器访问

```text
https://47.94.88.161
```

### 4.3 如果改用自动部署工具

数据库已人工导入完成后，在本地执行：

```bash
cd /Users/miao/my_project/allotcf
source scripts/venv/bin/activate
python scripts/deploy_prod.py --env prod
```

当前真实试跑已经确认这条命令可成功部署到：

```text
https://47.94.88.161
```

至少检查：

1. 登录页可打开
2. 可以登录
3. 套题列表能加载
4. 可以开始练习
5. 提交后能进入复盘
6. 错题复习页能打开

## 5. 安全组最少要求

### 应用服务器 `47.94.88.161`

- 开 `22`
- 开 `80`
- 不对公网开 `8080`

### 数据库服务器 `47.92.55.242`

- 开 `3389`
- 开 `3306`
  - 仅允许 `47.94.88.161`
