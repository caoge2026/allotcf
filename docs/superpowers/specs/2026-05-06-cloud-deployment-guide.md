# AllôTCF 云端移植安装步骤

> 状态：可执行说明
> 日期：2026-05-06

## 1. 部署目标

将当前本地项目部署到两台云服务器：

- 应用服务器
  - 系统：Alibaba Cloud Linux 4 LTS 64 位
  - 配置：2 核 2 GiB
  - 存储：40 GiB
  - 公网 IP：`47.94.88.161`
- 数据库服务器
  - 系统：Windows Server 2022 数据中心版 64 位中文版
  - 配置：2 核 2 GiB
  - 存储：20 GiB
  - 公网 IP：`47.92.55.242`
  - 已安装：MySQL 5.7

当前项目结构：

- 前端：React + Vite，构建产物是静态文件
- 后端：Spring Boot 3.2.5，Java 17，默认端口 `8080`
- 数据库：MySQL，库名 `allo`
- Web 代理：Nginx

推荐部署拓扑：

1. 用户访问 `47.94.88.161:80`
2. Nginx 提供前端静态资源
3. Nginx 反向代理 `/api/` 到本机 `127.0.0.1:8080`
4. Spring Boot 通过公网或内网连接数据库服务器 `47.92.55.242:3306`

## 2. 推荐迁移策略

不建议在云服务器上重新从源码完整开发式构建并重新导题，推荐采用“本地构建 + 上传产物 + 迁移数据库”的方式。

原因：

- 2 核 2 GiB 对 Java 构建、Node 构建和导题脚本同时运行不算宽裕
- 你本地已经有完整数据，包括 42 套阅读题
- 数据库迁移比在 Windows 服务器上重新跑导题脚本更稳

推荐迁移内容：

1. 本地构建前端 `dist`
2. 本地打包后端 `jar`
3. 本地导出 MySQL 数据
4. 云端安装 Java / Nginx
5. 导入数据库
6. 上传前后端产物
7. 配置系统服务并启动

当前资源规模下，这两台机器的磁盘容量是足够的：

- 应用服务器 `40 GiB`：足够容纳前端静态文件、后端 jar、日志和系统运行空间
- 数据库服务器 `20 GiB`：对当前 `allo` 整库和 42 套阅读题数据来说足够

## 3. 上云前本地准备

在本地机器执行。

### 3.1 前端构建

```bash
cd /Users/miao/my_project/allotcf/frontend
npm install
npm run build
```

构建完成后，产物目录为：

- `frontend/dist/`

### 3.2 后端打包

```bash
cd /Users/miao/my_project/allotcf/backend
mvn clean package -DskipTests
```

打包完成后，产物通常为：

- `backend/target/allotcf-0.0.1-SNAPSHOT.jar`

### 3.3 导出数据库

本次你已经确认数据库迁移方式为：`迁移完整数据库`。

也就是说，当前本地已经导入好的以下内容都一起迁过去：

- 42 套阅读题
- 统一题目归并结果
- 题目难度等级
- 用户数据
- 练习记录
- 错题与收藏

因此这里直接导出完整数据库：

```bash
mysqldump -u root -p123456 --databases allo --default-character-set=utf8mb4 > /Users/miao/my_project/allotcf/allo_full.sql
```

如果你只想迁表结构，不迁数据：

```bash
cp /Users/miao/my_project/allotcf/docs/schema.sql /Users/miao/my_project/allotcf/allo_schema.sql
```

推荐使用完整导出 `allo_full.sql`，因为这样可以直接把当前整套业务数据一起带上去。

## 4. 安全组与端口规划

建议先在阿里云控制台配置安全组。

### 4.1 应用服务器 `47.94.88.161`

入站建议开放：

- `22/tcp`
  - 仅你的办公 IP 或家庭 IP
- `80/tcp`
  - `0.0.0.0/0`
- `443/tcp`
  - 如果后面要上 HTTPS，可提前开放

不建议对公网开放：

- `8080/tcp`
  - 仅本机 `localhost` 使用，交给 Nginx 反代

### 4.2 数据库服务器 `47.92.55.242`

入站建议开放：

- `3389/tcp`
  - 仅你的办公 IP 或家庭 IP
- `3306/tcp`
  - 仅允许应用服务器 `47.94.88.161`

不建议：

- 对 `0.0.0.0/0` 开放 `3306`

## 5. 数据库服务器处理步骤（Windows Server 2022）

数据库服务器 `47.92.55.242` 已经安装了 MySQL 5.7，因此这次不需要重新安装 MySQL。

### 5.1 先确认 MySQL 版本与服务状态

在 Windows 服务器上先确认：

```powershell
mysql --version
```

并在“服务”中确认 MySQL 服务已经启动。

### 5.2 MySQL 5.7 兼容性说明

当前项目首版可以运行在 MySQL 5.7 上，但你要注意两点：

1. 本地和开发环境如果主要使用的是 MySQL 8，生产上最好后续统一版本
2. 当前整库导入时，`canonical_question.dedupe_key` 是 `utf8mb4 + VARCHAR(255) + UNIQUE`

在大多数 MySQL 5.7 环境里这通常可以正常导入；如果导入时出现索引长度错误，再单独处理该表的索引长度或行格式。

本次部署说明仍按“先直接整库导入”给出。

### 5.3 创建数据库账号

如果使用完整导入 `allo_full.sql`，可以直接在导入时自动创建库。

建议额外创建应用专用账号，不要让后端直接用 `root`：

```sql
CREATE USER 'allotcf_app'@'47.94.88.161' IDENTIFIED BY '请改成强密码';
GRANT ALL PRIVILEGES ON allo.* TO 'allotcf_app'@'47.94.88.161';
FLUSH PRIVILEGES;
```

### 5.4 导入完整数据库

本次直接导入完整数据库：

```powershell
mysql -u root -p < C:\deploy\allo_full.sql
```

### 5.5 开放 Windows 防火墙 3306

在 Windows Defender Firewall 中新增入站规则：

- 端口：`3306`
- 协议：`TCP`
- 来源：尽量限制为应用服务器 IP `47.94.88.161`

### 5.6 检查远程连接

在应用服务器上稍后可以用下面命令验证：

```bash
mysql -h 47.92.55.242 -P 3306 -u allotcf_app -p
```

## 6. 应用服务器安装步骤（Alibaba Cloud Linux 4）

## 6.1 更新系统

```bash
sudo dnf update -y
```

### 6.2 安装 Java 17

当前后端 `pom.xml` 指定的是 `java.version=17`，因此云端必须安装 Java 17。

本次真实试跑中，`ECS1` 最终采用的是系统仓库里的 `Alibaba Dragonwell 17` 无头版本，命令如下：

```bash
sudo dnf install -y java-17-alibaba-dragonwell-headless
java -version
```

### 6.3 安装 Nginx

可以使用系统仓库，也可以按 Nginx 官方仓库安装。

参考：

- [Nginx Linux packages 官方文档](https://nginx.org/en/linux_packages.html)

本次真实试跑中，直接使用系统仓库安装即可：

```bash
sudo dnf install -y nginx
nginx -v
```

建议同时启用：

```bash
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 6.4 创建部署目录

```bash
sudo mkdir -p /opt/allotcf/backend
sudo mkdir -p /etc/allotcf
sudo mkdir -p /var/www/allotcf
sudo chown -R $USER:$USER /opt/allotcf/backend /etc/allotcf
sudo chown -R nginx:nginx /var/www/allotcf
```

## 7. 上传部署文件

如果你改用本项目已经实现好的自动部署工具，那么这里不再需要手工 `scp` 上传产物。自动部署工具会自动完成：

- 前端 `dist` 上传到 `/var/www/allotcf`
- 后端 jar 上传到 `/opt/allotcf/backend`
- 生产配置写入 `/etc/allotcf/application-prod.yml`
- systemd 文件写入 `/etc/systemd/system/allotcf.service`
- Nginx 站点配置写入 `/etc/nginx/conf.d/allotcf.conf`

自动部署工具真实入口：

```bash
cd /Users/miao/my_project/allotcf
source scripts/venv/bin/activate
python scripts/deploy_prod.py --env prod
```

当前真实试跑已确认：

- 该命令可成功部署到 `https://47.94.88.161`
- 数据库仍要求先在 `ECS2` 人工完成整库导入

补充：

- 当前 `scripts/deploy/.env.prod` 已开启 HTTPS 配置
- 后续再次运行自动部署工具时，不会覆盖掉现有的 `443` 站点配置
- 当前证书使用 Let’s Encrypt IP 证书，续期后会自动 `reload nginx`

需要上传以下内容到应用服务器：

- 前端构建产物：`frontend/dist/*`
- 后端 jar：`backend/target/allotcf-0.0.1-SNAPSHOT.jar`
- `nginx.conf`

可用 `scp`：

```bash
scp -r /Users/miao/my_project/allotcf/frontend/dist/* root@47.94.88.161:/var/www/allotcf/
scp /Users/miao/my_project/allotcf/backend/target/allotcf-0.0.1-SNAPSHOT.jar root@47.94.88.161:/opt/allotcf/backend/
scp /Users/miao/my_project/allotcf/nginx.conf root@47.94.88.161:/etc/nginx/conf.d/allotcf.conf
```

如果你不用 `root` 登录，请改成你的实际用户，并在上传后用 `sudo mv` 放到对应目录。

## 8. 生产配置文件

当前本地配置文件是：

- [application.yml](/Users/miao/my_project/allotcf/backend/src/main/resources/application.yml)

里面仍然写的是本地数据库：

- `jdbc:mysql://localhost:3306/allo`
- 用户名 `root`
- 密码 `123456`
- JWT secret 是占位值

云端必须单独准备生产配置文件，例如：

- `/etc/allotcf/application-prod.yml`

内容建议为：

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

建议用下面命令生成 JWT secret：

```bash
openssl rand -base64 48
```

## 9. 配置 systemd 托管后端

因为 Spring Boot 是长期运行服务，推荐用 `systemd` 托管。

参考：

- [systemd 总体说明](https://www.freedesktop.org/software/systemd/man/latest/systemd.html)
- [systemd.service 文档](https://www.freedesktop.org/software/systemd/man/253/systemd.service.html)

创建文件：

- `/etc/systemd/system/allotcf.service`

内容示例：

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

说明：

- `-Xmx768m` 是考虑到你的服务器只有 2 GiB 内存，给 Java 留出余量，避免和 Nginx、系统进程抢内存
- 后面如果内存压力大，可以再调成 `-Xmx640m`

启用并启动：

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

## 10. 配置 Nginx

当前项目已有：

- [nginx.conf](/Users/miao/my_project/allotcf/nginx.conf)

这份配置核心逻辑已经适合首版部署：

- 前端根目录：`/var/www/allotcf`
- React SPA fallback：`try_files ... /index.html`
- `/api/` 代理到 `http://localhost:8080`

如果你部署到：

- `/etc/nginx/conf.d/allotcf.conf`

建议检查这几点：

1. `root /var/www/allotcf;`
2. `proxy_pass http://localhost:8080;`
3. 如果以后绑定域名，把 `server_name _;` 改成你的域名

测试配置并重启：

```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## 11. 联调验收

### 11.1 后端自检

在应用服务器上：

```bash
curl http://127.0.0.1:8080
```

如果根路径没有定义也没关系，重点是服务进程必须正常。

更实用的是直接看日志是否有启动完成信息：

- `Tomcat started on port 8080`

### 11.2 Nginx 自检

在应用服务器上：

```bash
curl http://127.0.0.1
```

应该返回前端 `index.html`。

### 11.3 浏览器验收

在本地浏览器访问：

- `http://47.94.88.161`

至少验证：

1. 登录页可打开
2. 测试账号可登录
3. 套题列表可加载
4. 开始练习可进入答题页
5. 提交后可进入复盘态
6. 错题复习页可加载

## 12. 本次数据库迁移结论

本次数据库迁移方案已经确定为：

- `整库迁移`

也就是：

- 直接导出本地 `allo`
- 在云端数据库服务器直接导入 `allo_full.sql`

本次不采用：

- 只迁表结构
- 只迁题库不迁用户数据
- 云端重新导题

## 13. 首次上线后建议立即做的事

1. 修改数据库 root 密码
2. 后端改用专用数据库账号，不再使用 root
3. 生成正式 JWT secret
4. 把 `3306` 只开放给应用服务器
5. 把 `22` 和 `3389` 限制到你的固定 IP
6. 准备数据库备份策略
7. 后续补 HTTPS

## 14. 一次性执行顺序建议

如果按最稳的顺序执行，建议是：

1. 本地构建前端
2. 本地打包后端
3. 本地导出数据库
4. Windows 服务器安装 MySQL
5. 导入数据库
6. Alibaba Cloud Linux 安装 Java 17 和 Nginx
7. 上传前端 `dist`
8. 上传后端 `jar`
9. 写生产 `application-prod.yml`
10. 配置 `systemd`
11. 配置 Nginx
12. 放通安全组
13. 联调验收

## 15. 官方参考

- MySQL Windows 参考：
  - [Installing MySQL on Microsoft Windows](https://dev.mysql.com/doc/refman/8.0/en/windows-installation.html)
  - [Windows Postinstallation Procedures](https://dev.mysql.com/doc/refman/8.0/en/windows-postinstallation.html)
- Nginx Linux 安装：
  - [nginx: Linux packages](https://nginx.org/en/linux_packages.html)
- Java 17 安装：
  - [Install Eclipse Temurin](https://adoptium.net/installation/)
- systemd：
  - [systemd](https://www.freedesktop.org/software/systemd/man/latest/systemd.html)
  - [systemd.service](https://www.freedesktop.org/software/systemd/man/253/systemd.service.html)
