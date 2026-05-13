# AllôTCF 自动部署工具实施计划

> 状态：已实现并完成真实环境试跑

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个本地可执行的 Python 自动部署工具，自动完成前端构建、后端打包、生成生产配置、上传到 ECS1 并远程重启应用与 Nginx。

**Architecture:** 工具以 `python scripts/deploy_prod.py --env prod` 形式运行，读取 `scripts/deploy/.env.prod`，在本地完成构建与渲染，再通过 SSH/SFTP 将产物和配置上传到 ECS1，最后远程执行 `systemd` 和 `nginx` 相关命令并做健康检查。数据库迁移不纳入首版自动化范围，默认由人工提前完成整库导入。

**Tech Stack:** Python 3、`python-dotenv`、`paramiko`、`pytest`、Jinja2 或纯文本模板、SSH/SFTP、systemd、Nginx。

---

## 文件结构

### 新增

- Create: `scripts/deploy_prod.py`
  - 主入口，负责参数解析、步骤编排、日志输出和错误退出
- Create: `scripts/deploy/.env.example`
  - 部署配置模板
- Create: `scripts/deploy/templates/application-prod.yml.j2`
  - Spring Boot 生产配置模板
- Create: `scripts/deploy/templates/allotcf.service.j2`
  - systemd 服务模板
- Create: `scripts/tests/test_deploy_prod.py`
  - 自动部署工具测试

### 可能修改

- Modify: `scripts/requirements.txt`
  - 增加 `paramiko`、`python-dotenv`、`jinja2`
- Modify: `.gitignore`
  - 忽略 `scripts/deploy/.env.prod`、临时渲染文件
- Modify: `docs/superpowers/specs/2026-05-06-auto-deploy-tool-design.md`
  - 如实施中发现必要的小修订，同步更新

## Task 1: 配置加载与命令入口

**Files:**
- Create: `scripts/deploy_prod.py`
- Create: `scripts/deploy/.env.example`
- Create: `scripts/tests/test_deploy_prod.py`
- Modify: `.gitignore`

- [ ] **Step 1: 写失败测试**

覆盖：

- `--env prod` 会去读取 `scripts/deploy/.env.prod`
- 缺少配置文件时抛出明确错误
- 缺少关键字段时抛出明确错误

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因 `deploy_prod.py` 或配置加载逻辑不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 解析 `--env`
- 约定配置文件路径
- 加载 `.env`
- 校验关键字段：
  - `DEPLOY_HOST`
  - `DEPLOY_PORT`
  - `DEPLOY_USER`
  - `DEPLOY_PASSWORD`
  - `DB_HOST`
  - `DB_PORT`
  - `DB_NAME`
  - `DB_USER`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `REMOTE_FRONTEND_DIR`
  - `REMOTE_BACKEND_DIR`
  - `REMOTE_APP_CONFIG`
  - `REMOTE_SYSTEMD_FILE`
  - `REMOTE_NGINX_FILE`
- 在 `.gitignore` 中加入：
  - `scripts/deploy/.env.prod`

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 配置加载相关测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy_prod.py scripts/deploy/.env.example scripts/tests/test_deploy_prod.py .gitignore
git commit -m "feat: add deploy config loading and cli entry"
```

## Task 2: 本地构建与打包步骤

**Files:**
- Modify: `scripts/deploy_prod.py`
- Modify: `scripts/tests/test_deploy_prod.py`

- [ ] **Step 1: 写失败测试**

覆盖：

- 会先执行前端 `npm run build`
- 再执行后端 `mvn clean package -DskipTests`
- 任一步失败时终止后续流程

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因缺少构建步骤编排而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 使用 `subprocess.run(...)`
- 固定工作目录：
  - `frontend`
  - `backend`
- 固定命令：
  - `npm run build`
  - `mvn clean package -DskipTests`
- 为失败步骤输出明确日志

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 构建编排测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy_prod.py scripts/tests/test_deploy_prod.py
git commit -m "feat: add local build and package steps to deploy tool"
```

## Task 3: 生产配置与 systemd 模板渲染

**Files:**
- Create: `scripts/deploy/templates/application-prod.yml.j2`
- Create: `scripts/deploy/templates/allotcf.service.j2`
- Modify: `scripts/deploy_prod.py`
- Modify: `scripts/tests/test_deploy_prod.py`
- Modify: `scripts/requirements.txt`

- [ ] **Step 1: 写失败测试**

覆盖：

- 能根据 `.env` 渲染 `application-prod.yml`
- 能根据 `.env` 渲染 `allotcf.service`
- 渲染结果包含：
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `JWT_SECRET`
  - `REMOTE_BACKEND_DIR`
  - `REMOTE_APP_CONFIG`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因模板或渲染逻辑不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 在 `requirements.txt` 增加：
  - `paramiko`
  - `python-dotenv`
  - `jinja2`
- 新增模板文件
- 在 `deploy_prod.py` 中渲染到临时目录

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 模板渲染测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/requirements.txt scripts/deploy/templates/application-prod.yml.j2 scripts/deploy/templates/allotcf.service.j2 scripts/deploy_prod.py scripts/tests/test_deploy_prod.py
git commit -m "feat: add deploy config templates"
```

## Task 4: SSH / SFTP 上传能力

**Files:**
- Modify: `scripts/deploy_prod.py`
- Modify: `scripts/tests/test_deploy_prod.py`

- [ ] **Step 1: 写失败测试**

覆盖：

- 会连接 `DEPLOY_HOST`
- 会创建远程目录
- 会上传：
  - 前端 `dist`
  - 后端 jar
  - `application-prod.yml`
  - `allotcf.service`
  - `nginx.conf`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因 SSH/SFTP 逻辑不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 用 `paramiko.SSHClient`
- 用 `open_sftp()`
- 抽出上传函数：
  - 上传单文件
  - 上传目录树
- 先创建远程目录：
  - `/opt/allotcf/backend`
  - `/etc/allotcf`
  - `/var/www/allotcf`

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 上传编排测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy_prod.py scripts/tests/test_deploy_prod.py
git commit -m "feat: add ssh upload support to deploy tool"
```

## Task 5: 远程部署命令执行

**Files:**
- Modify: `scripts/deploy_prod.py`
- Modify: `scripts/tests/test_deploy_prod.py`

- [ ] **Step 1: 写失败测试**

覆盖：

- 会顺序执行：
  - `mkdir -p ...`
  - `chown ...`
  - `systemctl daemon-reload`
  - `systemctl restart allotcf`
  - `nginx -t`
  - `systemctl restart nginx`
- `nginx -t` 失败时终止流程

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因远程命令执行逻辑不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 抽出远程命令执行函数
- 捕获 `stdout` / `stderr`
- 非零退出码时抛明确异常
- 对 `nginx -t` 单独保留可读错误输出

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 远程命令编排测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy_prod.py scripts/tests/test_deploy_prod.py
git commit -m "feat: add remote deploy command execution"
```

## Task 6: 健康检查与最终输出

**Files:**
- Modify: `scripts/deploy_prod.py`
- Modify: `scripts/tests/test_deploy_prod.py`

- [ ] **Step 1: 写失败测试**

覆盖：

- 部署后会远程执行：
  - `curl http://127.0.0.1:8080`
  - `curl http://127.0.0.1`
- 最终输出：
  - 部署成功
  - 访问地址 `PUBLIC_BASE_URL`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 因健康检查逻辑不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 远程执行健康检查命令
- 检查退出码
- 以清晰日志输出最终 URL

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`

Expected: 健康检查测试通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/deploy_prod.py scripts/tests/test_deploy_prod.py
git commit -m "feat: add deploy health checks"
```

## Task 7: 真实环境联调与文档回填

**Files:**
- Modify: `docs/superpowers/specs/2026-05-06-auto-deploy-tool-design.md`
- Modify: `docs/superpowers/specs/2026-05-06-cloud-deployment-quick-commands.md`
- Modify: `docs/superpowers/specs/2026-05-06-cloud-deployment-guide.md`

- [ ] **Step 1: 安装脚本依赖**

Run:

```bash
cd /Users/miao/my_project/allotcf/scripts
source venv/bin/activate
pip install -r requirements.txt
```

Expected: 依赖安装成功。

- [ ] **Step 2: 写本地私有配置**

创建：

- `scripts/deploy/.env.prod`

填入真实：

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_PASSWORD`
- `DB_*`
- `JWT_SECRET`

- [ ] **Step 3: 在真实环境试跑**

Run:

```bash
cd /Users/miao/my_project/allotcf
source scripts/venv/bin/activate
python scripts/deploy_prod.py --env prod
```

Expected:

- 本地构建成功
- 文件上传成功
- ECS1 后端与 Nginx 重启成功
- 输出访问地址

- [ ] **Step 4: 回填文档**

在设计文档和部署说明中补上：

- 工具实际入口
- `.env.prod` 位置
- 注意事项

- [ ] **Step 5: Commit**

```bash
git add scripts docs/superpowers/specs/2026-05-06-auto-deploy-tool-design.md docs/superpowers/specs/2026-05-06-cloud-deployment-guide.md docs/superpowers/specs/2026-05-06-cloud-deployment-quick-commands.md
git commit -m "feat: add production deploy tool"
```

## 实际完成情况补充

截至 `2026-05-06`，当前计划对应实现已完成并验证：

- `scripts/deploy_prod.py` 已实现
- `scripts/deploy/.env.example` 与 `scripts/deploy/.env.prod` 已可用
- 模板文件已实现：
  - `application-prod.yml.j2`
  - `allotcf.service.j2`
  - `nginx.conf.j2`
- 本地测试已通过：
  - `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_deploy_prod.py -v`
- 真实 `prod` 环境已试跑成功：
  - `python scripts/deploy_prod.py --env prod`
  - 访问地址：`http://47.94.88.161`

真实试跑中确认的额外前提：

- `ECS1` 需要预装：
  - `java-17-alibaba-dragonwell-headless`
  - `nginx`
- Spring Boot 冷启动大约需要 `9-10` 秒，因此健康检查已实现自动重试
