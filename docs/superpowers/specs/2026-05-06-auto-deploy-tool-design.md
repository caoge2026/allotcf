# AllôTCF 自动部署工具设计说明

> 状态：已实现并完成真实环境试跑
> 日期：2026-05-06

## 1. 目标

为当前项目增加一个本地可执行的自动部署工具，用来把应用从开发机发布到云端应用服务器。

本次工具的目标不是做成完整 DevOps 平台，而是把当前最频繁、最稳定、最容易重复出错的发布动作收敛成一次可重复执行的命令。

工具首版目标：

- 从本地一键构建前端
- 从本地一键打包后端
- 读取本地生产配置
- 自动连接应用服务器 `ECS1`
- 自动上传前后端产物与部署配置
- 自动重启后端服务和 Nginx
- 自动做基础健康检查

真实环境验证结果：

- 已使用 `scripts/deploy/.env.prod` 在 `ECS1` 上完成完整真实部署
- 实际部署入口：

```bash
cd /Users/miao/my_project/allotcf
source scripts/venv/bin/activate
python scripts/deploy_prod.py --env prod
```

- 实际可访问地址：
  - `http://47.94.88.161`

## 2. 当前部署边界

当前云端环境：

- `ECS1` 应用服务器
  - `47.94.88.161`
  - Alibaba Cloud Linux 4
  - 2 核 2 GiB
  - 40 GiB
  - 当前可用登录方式：`SSH + root + 密码`
- `ECS2` 数据库服务器
  - `47.92.55.242`
  - Windows Server 2022
  - 2 核 2 GiB
  - 20 GiB
  - 已安装 MySQL 5.7
  - 当前自动化远程能力不足，仅确认 `RDP` 可用
  - `WinRM` 服务运行中，但当前没有可直接用于自动部署的远程监听入口

因此首版自动部署工具的边界明确为：

- 自动化只覆盖 `ECS1`
- 数据库默认由人工提前完成整库迁移

真实试跑还确认了一个前提：

- `ECS1` 必须预装 `Java 17` 与 `Nginx`
- 如果缺少其中之一，部署会在远程重启或健康检查阶段失败

也就是说，首版工具运行前，假定：

- `allo` 数据库已经导入到 `ECS2`
- 数据库账号已经可供应用服务器访问

## 3. 设计结论

本次采用：

- `Python CLI`
- 本地 `.env` 配置文件
- 通过 `SSH` 远程操作 `ECS1`

程序入口形式为：

```bash
python scripts/deploy_prod.py --env prod
```

这是当前最适合的方案，因为：

- 比 shell 脚本更容易管理错误处理和步骤编排
- 比 YAML 方案更轻，首版上手更快
- 和你当前“本地一键发版到单台 Linux 应用服务器”的目标完全匹配

## 4. 工具职责

首版工具负责：

1. 读取本地部署配置
2. 校验关键配置是否完整
3. 本地构建前端
4. 本地打包后端
5. 生成生产环境配置文件
6. 通过 SSH / SFTP 上传文件到 `ECS1`
7. 远程执行部署命令
8. 返回健康检查结果

首版工具不负责：

- 自动连接 `ECS2`
- 自动导入数据库
- 自动申请 HTTPS 证书
- 自动回滚
- 自动灰度发布
- 多环境并发部署

## 5. 运行方式

命令形式：

```bash
python scripts/deploy_prod.py --env prod
```

解释：

- `scripts/deploy_prod.py`
  - 主入口程序
- `--env prod`
  - 指定读取 `scripts/deploy/.env.prod`

以后如果有测试环境，也可以扩展为：

- `--env staging`
- `--env demo`

## 6. 配置设计

首版使用本地 `.env` 文件集中管理所有部署参数。

建议目录：

- `scripts/deploy/.env.example`
- `scripts/deploy/.env.prod`

### 6.1 建议配置项

```env
DEPLOY_HOST=47.94.88.161
DEPLOY_PORT=22
DEPLOY_USER=root
DEPLOY_PASSWORD=请填写ECS1密码

DB_HOST=47.92.55.242
DB_PORT=3306
DB_NAME=allo
DB_USER=allotcf_app
DB_PASSWORD=请填写数据库应用账号密码

JWT_SECRET=请填写至少32位随机强密钥

REMOTE_FRONTEND_DIR=/var/www/allotcf
REMOTE_BACKEND_DIR=/opt/allotcf/backend
REMOTE_APP_CONFIG=/etc/allotcf/application-prod.yml
REMOTE_SYSTEMD_FILE=/etc/systemd/system/allotcf.service
REMOTE_NGINX_FILE=/etc/nginx/conf.d/allotcf.conf

APP_PORT=8080
ENABLE_HTTPS=true
TLS_CERT_PATH=/etc/letsencrypt/live/47.94.88.161/fullchain.pem
TLS_KEY_PATH=/etc/letsencrypt/live/47.94.88.161/privkey.pem
PUBLIC_BASE_URL=https://47.94.88.161
```

说明：

- `ENABLE_HTTPS=true` 时，部署工具会渲染 `80 -> 443` 跳转和 `443 ssl` 站点配置
- 如果暂时不启用 HTTPS，可以去掉这 3 个字段，或把 `ENABLE_HTTPS=false`

### 6.2 为什么配置集中在本地

原因：

- 以后发布时不需要反复改脚本
- 配置和代码逻辑分离
- 后续增加 `staging / prod` 时更自然

## 7. 目录与文件设计

建议新增以下结构：

- `scripts/deploy_prod.py`
  - 主程序入口
- `scripts/deploy/.env.example`
  - 配置模板
- `scripts/deploy/templates/application-prod.yml.j2`
  - 后端生产配置模板
- `scripts/deploy/templates/allotcf.service.j2`
  - systemd 模板

如果首版不引入模板引擎，也可以先用 Python 拼接纯文本生成：

- `application-prod.yml`
- `allotcf.service`

但从后续可维护性看，保留模板文件更好。

当前实际模板文件为：

- `scripts/deploy/templates/application-prod.yml.j2`
- `scripts/deploy/templates/allotcf.service.j2`
- `scripts/deploy/templates/nginx.conf.j2`

## 8. 部署流程设计

首版部署顺序建议固定为：

### Step 1: 读取与校验配置

程序启动后先检查：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PASSWORD`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `JWT_SECRET`

若缺少关键字段，立即失败，不进入构建和上传阶段。

### Step 2: 本地构建前端

执行：

```bash
cd frontend
npm run build
```

要求：

- 构建失败则整体部署失败
- 不继续执行后续步骤

### Step 3: 本地打包后端

执行：

```bash
cd backend
mvn clean package -DskipTests
```

要求：

- 打包失败则整体部署失败

### Step 4: 本地生成生产配置文件

生成临时文件：

- `application-prod.yml`
- `allotcf.service`

这两个文件由 `.env.prod` 动态渲染出来，不直接写死在仓库里。

### Step 5: 连接应用服务器

通过：

- `paramiko`

建立 SSH 与 SFTP 连接。

首版采用：

- `root + 密码`

后续如果你切到 SSH 密钥登录，再扩展。

### Step 6: 上传文件

上传到 `ECS1`：

- 前端 `dist/*` -> `/var/www/allotcf/`
- 后端 `jar` -> `/opt/allotcf/backend/`
- `application-prod.yml` -> `/etc/allotcf/application-prod.yml`
- `allotcf.service` -> `/etc/systemd/system/allotcf.service`
- `nginx.conf` -> `/etc/nginx/conf.d/allotcf.conf`

### Step 7: 远程执行部署命令

远程执行顺序：

1. 创建目录
2. 修正权限
3. `systemctl daemon-reload`
4. `systemctl restart allotcf`
5. `nginx -t`
6. `systemctl restart nginx`

这里必须保证：

- 如果 `nginx -t` 失败，不要继续 `restart nginx`
- 每一步都输出可读日志

真实试跑补充：

- `allotcf.service` 中实际使用 `/usr/bin/java`
- `nginx` 站点配置写入 `/etc/nginx/conf.d/allotcf.conf`

### Step 8: 健康检查

远程执行：

```bash
curl http://127.0.0.1:8080
curl http://127.0.0.1
```

如果应用根路径没有定义，不要求返回业务内容，但至少要确认：

- `allotcf` 进程已正常启动
- `nginx` 配置生效
- 前端静态资源已可访问

由于 Spring Boot 在当前 `ECS1` 上冷启动大约需要 `9-10` 秒，当前实现已经增加：

- 后端健康检查自动重试
- 当前重试窗口：
  - 最多 `10` 次
  - 每次间隔 `2` 秒

输出最终访问地址：

- `http://47.94.88.161`

## 9. 错误处理设计

首版程序需要明确区分以下错误：

### 9.1 配置错误

例如：

- 缺少 `.env.prod`
- `JWT_SECRET` 为空
- `DB_HOST` 未填写

处理：

- 启动即退出
- 输出清晰错误项

### 9.2 本地构建错误

例如：

- 前端构建失败
- Maven 打包失败

处理：

- 立即停止部署
- 不执行远程上传

### 9.3 远程连接错误

例如：

- SSH 登录失败
- 网络超时
- 认证失败

处理：

- 立即停止
- 明确指出是连接阶段失败

### 9.4 远程命令错误

例如：

- `systemctl restart allotcf` 失败
- `nginx -t` 失败

处理：

- 保留错误输出
- 中止后续步骤

## 10. 安全设计

首版既然采用 `.env` 保存密码，就要明确这只是“可接受的首版方案”，不是长期最佳方案。

当前安全要求：

- `.env.prod` 必须加入 `.gitignore`
- 不允许提交到仓库
- 文档中明确这是本地私有文件

后续推荐演进方向：

1. `SSH` 改为密钥登录
2. 数据库密码改走更安全的本地 secret 管理
3. `JWT_SECRET` 改由专门 secret 文件或密钥管理服务提供

## 11. 技术选型

首版 Python 依赖建议：

- `paramiko`
  - SSH / SFTP
- `python-dotenv`
  - 读取 `.env`
- `jinja2`
  - 模板渲染
- `paramiko`
  - SSH / SFTP

## 12. 测试与验证

实现后至少验证：

1. 缺少 `.env.prod` 时程序正确报错
2. `.env.prod` 缺少关键字段时程序正确报错
3. 前端构建失败时程序终止
4. 后端打包失败时程序终止
5. 能正确连接 `ECS1`
6. 能正确上传前端文件、jar 和配置
7. 能正确重启 `allotcf`
8. 能正确执行 `nginx -t`
9. 部署成功后可访问：
   - `http://47.94.88.161`

当前实际验证结论：

- `pytest tests/test_deploy_prod.py -v` 已通过
- 真实 `prod` 部署已跑通

## 13. 后续扩展方向

这版工具完成后，下一阶段可以继续扩展：

### 13.1 数据库自动导入

前提：

- `ECS2` 具备可程序化远程控制能力
- 例如启用 `WinRM` 或安装 `OpenSSH`

### 13.2 多环境部署

支持：

- `prod`
- `staging`
- `demo`

### 13.3 回滚

支持：

- 保留上一版本 jar
- 保留上一版前端静态目录
- 一键回退

### 13.4 HTTPS

支持：

- 自动写入域名版 Nginx 配置
- 接入证书部署

## 14. 最终决策

本次自动部署工具采用：

- `python scripts/deploy_prod.py --env prod`
- 本地 `.env.prod` 管理部署参数
- 只自动部署 `ECS1`
- 数据库由人工先完成整库迁移
- 通过 `SSH + root + 密码` 自动上传和远程执行

这是当前最符合你现有服务器条件、又能最快投入使用的首版方案。
