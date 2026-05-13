# TCF Canada 练习平台 — 整体架构设计

> 状态：已确认
> 日期：2026-05-03

---

## 产品定位

TCF Canada 真题练习平台，帮助中国移民申请人备考法语考试。
- 一期：阅读真题练习
- 二期：听力练习 + 词汇背诵

---

## 架构决策汇总

| 决策项 | 结论 |
|---|---|
| 仓库结构 | Monorepo |
| 前端 | React + Vite（构建静态文件） |
| 后端 | Spring Boot 3.x + Java 17 |
| 数据库 | MySQL 8.x |
| 反向代理 | Nginx |
| 认证 | JWT（无状态） |
| 前端状态管理 | Zustand |
| API 风格 | REST + 动词路径（动作型接口） |
| 内容导入 | Python 脚本，ECS 1 内网直连 MySQL |
| 整体架构 | 前后端分离，静态前端 |

---

## 部署拓扑

```
ECS 1（应用服务器 2vCPU 2GiB）
├── Nginx :80/:443
│   ├── /          → /frontend/dist（静态文件）
│   └── /api/*     → localhost:8080（反向代理）
└── Spring Boot :8080

ECS 2（数据库服务器 2vCPU 2GiB）
└── MySQL :3306（仅开放 ECS 1 内网 IP）
```

**内存估算（ECS 1）**
```
Alibaba Cloud Linux 4   ~200MB
Spring Boot (JVM)       ~400-500MB
Nginx                   ~20MB
剩余                    ~1.3GB
```

**请求链路**
```
用户浏览器
  → Nginx → React 静态文件（页面渲染）
  → Nginx → Spring Boot（API 请求）
  → Spring Boot → MySQL（数据读写）
```

**内容导入链路**
```
Word 文档 → Python 脚本（ECS 1）→ 内网直连 MySQL（ECS 2）
```

---

## Monorepo 目录结构

```
allotcf/
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/             # 路由页面
│   │   ├── components/        # 可复用 UI 组件
│   │   ├── stores/            # Zustand 状态
│   │   ├── services/          # axios 封装，API 调用
│   │   └── types/             # TypeScript 类型定义
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                   # Spring Boot 3.x
│   └── src/main/java/
│       └── com/allotcf/
│           ├── controller/    # REST 接口层
│           ├── service/       # 业务逻辑
│           ├── repository/    # JPA 数据访问
│           ├── entity/        # 数据库实体
│           ├── dto/           # 请求/响应数据结构
│           └── config/        # JWT、Security、CORS 配置
│
├── scripts/                   # Python 内容导入
│   ├── import.py
│   └── requirements.txt
│
└── docs/                      # 文档
    ├── decisions.md
    ├── prd.md
    └── superpowers/specs/
```

---

## 前端架构

### 路由结构（React Router）

```
/               → 重定向到 /login 或 /exam-sets
/login          → 登录页
/register       → 注册页
/exam-sets      → 题库列表页
/practice/:id   → 答题页
/result/:id     → 结果页
```

### Zustand Store

| Store | 内容 |
|---|---|
| `userStore` | 当前登录用户信息、JWT token |
| `practiceStore` | 当前 session、题目列表、已答题目、当前题号 |

### Services 层

| Service | 方法 |
|---|---|
| `authService` | login、register、logout |
| `examSetService` | 获取题库列表、题库详情 |
| `practiceService` | 开始练习、提交答案 |

### 页面交互流程

```
题库列表页
  → 点击套题 → POST /api/practice-sessions → 跳转答题页

答题页
  → 逐题展示（阅读材料 + 四选一）
  → 答题记录存入 practiceStore
  → 最后一题完成 → POST /api/practice-sessions/{id}/submit
  → 跳转结果页

结果页
  → 展示得分、逐题对错、正确答案
```

---

## 后端架构

### API 接口清单

```
# 认证（无需鉴权）
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout

# 题库（需鉴权）
GET  /api/exam-sets
GET  /api/exam-sets/{id}

# 练习（需鉴权）
POST /api/practice-sessions
POST /api/practice-sessions/{id}/submit
GET  /api/practice-sessions/{id}/result
```

### 分层职责

| 层 | 职责 |
|---|---|
| Controller | 接收请求、参数校验、返回响应 |
| Service | 业务逻辑（计分、记录答案） |
| Repository | JPA 查询 MySQL |
| Entity | 对应数据库四张表 |
| DTO | 请求体和响应体，与 Entity 解耦 |
| Config | JWT Filter、Spring Security、CORS |

### JWT 鉴权流程

```
登录 → 返回 JWT token
前端请求携带 Header: Authorization: Bearer <token>
JWT Filter 验证 token → 放行或返回 401
/api/auth/* → 不需要鉴权
其余接口 → 全部需要鉴权
```

### 数据库表（来自 decisions.md）

```
exam_set          套题（一个 Word 文档 = 一套题）
question          题目（含四个选项和正确答案）
practice_session  练习记录（一次做完一套题）
answer_record     每道题的答题记录
```

---

## 内容导入流程（Python 脚本）

### Word 文档格式规范

```
文档顶部：答案: ACDAB BCAAB...（去空格后按顺序对应题号）

每题结构：
  题号（大标题）
  题目问句（加粗）
  阅读材料（正文）
  Options:（加粗）
  A. 选项一
  B. 选项二
  C. 选项三
  D. 选项四
```

### 脚本执行流程

```
1. 读取 Word 文档（python-docx）
2. 解析答案行，提取答案序列
3. 逐题解析：题号、题目、阅读材料、四个选项
4. 提示输入套题标题
5. 写入 MySQL：INSERT exam_set → 批量 INSERT question
6. 输出导入结果：成功 X 题，失败 X 题
```

### 使用方式

```bash
# 在 ECS 1 上执行
python scripts/import.py --file 阅读真题1.docx --title "阅读练习第一套"
```

---

## 开发顺序（建议）

1. 初始化 Monorepo（前端脚手架 + 后端脚手架 + 数据库建表）
2. Python 导入脚本（先有数据，才能开发和测试其他功能）
3. Spring Boot API（认证 → 题库接口 → 练习接口）
4. React 页面（登录注册 → 题库列表 → 答题页 → 结果页）
5. Nginx 配置 + ECS 部署
