# TCF Canada 练习平台 — 决策文档

> 记录每个阶段的产品、技术、架构决策。每次重大决定后更新。

---

## 产品定位

### 核心产品

TCF Canada **听力 + 阅读题目练习网站**，专为中国移民申请人备考设计。

### 目标用户

- 中国成年人，母语中文
- 计划通过 TCF Canada 申请加拿大移民
- 法语水平 A1-A2，目标 B2

### 核心价值主张

> 用真实 TCF Canada 题目刷题，直接练习考试内容，最短路径通过考试。

### 产品范围决策

| 决策 | 结论 | 原因 |
|---|---|---|
| 产品形态 | 题目练习平台（非词汇背诵） | 刷题做对题目是最终目标，词汇背诵是辅助手段 |
| 一期范围 | 阅读练习 | 听力需要音频处理，复杂度更高，放二期 |
| 二期范围 | 听力练习 + 词汇背诵 | 阅读验证后扩展 |

---

## 技术决策

### 技术栈

| 层 | 技术 | 原因 |
|---|---|---|
| 前端 | React + Vite | 组件化，构建静态文件 |
| 后端 | Spring Boot 3.x | 团队熟悉 Java 生态 |
| 数据库 | MySQL 8.x | 团队熟悉，生态成熟，Spring Boot 集成简单 |
| 反向代理 | Nginx | 托管 React 静态文件 + 代理 API |
| 内容导入 | Python 脚本（python-docx） | 处理 Word 文档最方便的生态 |

### 架构决策

- **单体架构**，非微服务（原因：MVP 阶段团队小，用户规模小，微服务带来不必要的复杂度）
- **前后端分离**：React 静态文件由 Nginx 托管，Spring Boot 提供 REST API

### 内容导入流程

```
Word 文档（题目 + 答案）
    ↓ Python 脚本（python-docx）
MySQL
    ↓ Spring Boot API
React 前端
```

**Word 文档格式规范：**
- 文档顶部：答案行，格式为 `答案: ACDAB BCAAB...`（去空格后按顺序对应题号）
- 每题结构：题号（大标题）→ 题目（加粗）→ 阅读材料（正文）→ `Options:`（加粗）→ A/B/C/D 选项

---

## 服务器配置

### 硬件

| 服务器 | 规格 | 用途 |
|---|---|---|
| ECS 1 | 2vCPU 2GiB（ecs.e-c1m1.large） | 应用服务器（Nginx + Spring Boot） |
| ECS 2 | 2vCPU 2GiB（ecs.e-c1m1.large） | 数据库服务器（MySQL） |

- 云厂商：阿里云
- 实例类型：经济型 e
- 操作系统：Alibaba Cloud Linux 4 LTS 64位（普通版，非容器优化版）
- 网络：同地域内网通信（低延迟，免费）

### 安全配置要求

- ECS 2 的 MySQL 端口（3306）只开放 ECS 1 内网 IP 访问

### 资源估算

**ECS 1（应用服务器）**
```
Nginx          ~20MB
Spring Boot    ~400-500MB
操作系统        ~200MB
剩余           ~1.3GB
```

**ECS 2（数据库服务器）**
```
MySQL          ~300-400MB
操作系统        ~200MB
剩余           ~1.4GB
```

---

## 数据库设计

### Schema（一期）

```sql
-- 套题（一个 Word 文档 = 一套题）
CREATE TABLE exam_set (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    type        VARCHAR(20)  NOT NULL DEFAULT 'READING', -- READING / LISTENING
    audio_url   VARCHAR(500),                            -- 听力题音频，阅读题为空
    created_at  DATETIME DEFAULT NOW()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 题目
CREATE TABLE question (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    exam_set_id    BIGINT NOT NULL,
    sequence_order INT    NOT NULL,           -- 题目在套题中的顺序
    question_no    VARCHAR(20),               -- 原始题号，如"9-1"
    passage        TEXT,                      -- 阅读材料
    question_text  VARCHAR(500) NOT NULL,     -- 题目问句
    option_a       VARCHAR(300) NOT NULL,
    option_b       VARCHAR(300) NOT NULL,
    option_c       VARCHAR(300) NOT NULL,
    option_d       VARCHAR(300) NOT NULL,
    correct_answer CHAR(1)      NOT NULL,     -- A / B / C / D
    FOREIGN KEY (exam_set_id) REFERENCES exam_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 用户（邮箱注册）
CREATE TABLE users (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    email        VARCHAR(200) UNIQUE NOT NULL,
    password     VARCHAR(100) NOT NULL,       -- bcrypt hash
    nickname     VARCHAR(50),
    created_at   DATETIME DEFAULT NOW(),
    last_login   DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 练习记录（一次做完一套题 = 一条记录）
CREATE TABLE practice_session (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    exam_set_id   BIGINT NOT NULL,
    started_at    DATETIME DEFAULT NOW(),
    finished_at   DATETIME,                   -- 未完成则为空
    total_count   INT,
    correct_count INT,
    FOREIGN KEY (user_id)     REFERENCES users(id),
    FOREIGN KEY (exam_set_id) REFERENCES exam_set(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 每道题的答题记录
CREATE TABLE answer_record (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    practice_session_id BIGINT  NOT NULL,
    question_id         BIGINT  NOT NULL,
    user_answer         CHAR(1) NOT NULL,
    is_correct          TINYINT(1) NOT NULL,
    time_spent_seconds  INT,                  -- 这道题花了多少秒
    FOREIGN KEY (practice_session_id) REFERENCES practice_session(id),
    FOREIGN KEY (question_id)         REFERENCES question(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 数据分析能力

| 数据字段 | 可分析内容 |
|---|---|
| `practice_session.finished_at` 为空 | 用户中途放弃率 |
| `answer_record.time_spent_seconds` | 哪些题让用户犹豫最久 |
| `answer_record.user_answer` | 错题的错误选项分布 |
| `practice_session` 次数 | 哪套题最受欢迎 |
| `users.last_login` | 用户活跃度 |

---

## MVP 用户功能范围

### 核心用户旅程

```
注册/登录 → 选择一套阅读题 → 逐题作答 → 查看结果（对X题，错X题）
```

### 一期功能清单

- [ ] 用户注册（邮箱）
- [ ] 用户登录/登出
- [ ] 题目列表页（选套题）
- [ ] 答题页（阅读材料 + 四选一）
- [ ] 结果页（得分 + 错题回顾）
- [ ] Word 文档解析脚本（内容导入）

### 二期功能清单（待规划）

- [ ] 听力题练习（音频播放）
- [ ] 词汇背诵模块
- [ ] 用户学习历史/统计
- [ ] 错题本

---

## 开发顺序

1. **Python 解析脚本** — 将 Word 文档导入数据库
2. **Spring Boot API** — 查题目、提交答案、用户注册登录
3. **React 页面** — 列表页、答题页、结果页
