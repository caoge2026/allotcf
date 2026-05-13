# 错题复习与复盘模式实施计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为阅读科目加入“提交后原页复盘 + 错题复习 + 收藏能力 + 科目/任务导航骨架”，并补齐错题复习页的左侧固定筛选栏、题目难度等级与关键词筛选能力，为后续听力、写作、口语扩展预留结构。

**Architecture:** 后端新增统一题目归并、错题累计、收藏与错题复习接口；前端将当前结果页能力收拢进答题页复盘态，并在应用层新增“科目 tab + 任务 tab”壳层。结果提交后不再跳转到信息稀薄的独立结果页，而是直接在原答题页切换到可复盘、可收藏、可进入错题复习的讲评视图。错题复习筛选采用“后端过滤 + 前端左侧固定筛选栏”的方式实现，同时把阅读题难度等级作为题目数据层属性沉淀下来，而不是仅在页面临时计算。

**收藏练习:** 收藏题不应依赖错题记录才能被复习。已新增 `收藏练习`，用于集中练习所有已收藏题目，包括“只收藏但从未答错”的题；其筛选项中保留 `只看做错过的收藏题`，默认关闭。

**Tech Stack:** React + Vite + TypeScript + React Router + Zustand，Spring Boot + JPA + MySQL，Vitest，JUnit 5，Python 导题脚本。

---

## 文件结构

### 后端

- Modify: `backend/src/main/resources/application.yml`
  - 视情况增加 schema 变更策略说明或初始化配置
- Modify: `docs/schema.sql`
  - 增加统一题目、错题统计、收藏表结构与索引
- Modify: `backend/src/main/java/com/allotcf/entity/Question.java`
  - 增加 `canonicalQuestion` 关联
- Create: `backend/src/main/java/com/allotcf/entity/CanonicalQuestion.java`
  - 统一题目实体，持有去重键、标准答案与阅读题难度等级
- Create: `backend/src/main/java/com/allotcf/entity/UserWrongQuestion.java`
  - 用户错题累计实体
- Create: `backend/src/main/java/com/allotcf/entity/UserQuestionBookmark.java`
  - 用户收藏实体
- Create: `backend/src/main/java/com/allotcf/repository/CanonicalQuestionRepository.java`
- Create: `backend/src/main/java/com/allotcf/repository/UserWrongQuestionRepository.java`
- Create: `backend/src/main/java/com/allotcf/repository/UserQuestionBookmarkRepository.java`
- Modify: `backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java`
  - 改为承载复盘模式所需完整数据
- Modify: `backend/src/main/java/com/allotcf/dto/practice/QuestionResultDto.java`
  - 增加判分、收藏、统一题目标识、题面展示所需字段
- Create: `backend/src/main/java/com/allotcf/dto/review/WrongQuestionListItemDto.java`
  - 增加 `difficultyLevel` 供错题筛选与展示复用
- Create: `backend/src/main/java/com/allotcf/dto/review/ToggleBookmarkRequest.java`
- Modify: `backend/src/main/java/com/allotcf/service/PracticeService.java`
  - 提交后累计错题并返回复盘数据
- Create: `backend/src/main/java/com/allotcf/service/WrongQuestionService.java`
  - 错题复习列表、收藏切换、筛选条件解析
- Create: `backend/src/main/java/com/allotcf/controller/WrongQuestionController.java`
  - 错题复习接口
- Create: `backend/src/main/java/com/allotcf/controller/BookmarkController.java`
  - 收藏 / 取消收藏接口
- Modify: `backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`
- Create: `backend/src/test/java/com/allotcf/service/WrongQuestionServiceTest.java`
- Create: `backend/src/test/java/com/allotcf/controller/WrongQuestionControllerTest.java`

### 导题脚本

- Modify: `scripts/import_script.py`
  - 生成 dedupe key、阅读题难度等级并写入 `canonical_question`
- Modify: `scripts/tests/test_import.py`
  - 覆盖重复题归并规则

### 前端

- Modify: `frontend/src/App.tsx`
  - 接入科目/任务层级路由
- Create: `frontend/src/components/StudyTabs.tsx`
  - 顶部一级 tab 与二级 tab 壳层
- Modify: `frontend/src/types/index.ts`
  - 新增复盘模式、错题复习、收藏、难度等级与筛选相关类型
- Modify: `frontend/src/services/practiceService.ts`
  - 适配提交后复盘响应结构
- Create: `frontend/src/services/wrongQuestionService.ts`
  - 错题列表筛选、收藏操作
- Modify: `frontend/src/pages/PracticePage.tsx`
  - 增加复盘模式
- Modify: `frontend/src/pages/ExamSetListPage.tsx`
  - 挂进阅读 -> 套题练习层级
- Create: `frontend/src/pages/WrongQuestionPage.tsx`
  - 阅读错题复习页与左侧固定筛选栏
- Create: `frontend/src/pages/ListeningPlaceholderPage.tsx`
  - 听力“即将开放”页
- Modify: `frontend/src/index.css`
  - tab、复盘态、错题列表、收藏状态样式，以及左侧固定筛选栏布局
- Modify: `frontend/src/__tests__/pages/PracticePage.test.tsx`
- Create: `frontend/src/__tests__/pages/WrongQuestionPage.test.tsx`
- Modify: `frontend/src/__tests__/pages/ExamSetListPage.test.tsx`
- Create: `frontend/src/__tests__/services/wrongQuestionService.test.ts`

### 收藏练习扩展

- Create: `frontend/src/pages/BookmarkedQuestionPage.tsx`
  - 收藏练习页，默认展示所有收藏题
- Create: `frontend/src/services/bookmarkedQuestionService.ts`
  - 收藏题列表筛选与收藏切换
- Create: `backend/src/main/java/com/allotcf/dto/review/BookmarkedQuestionListItemDto.java`
  - 收藏练习列表项
- Modify: `backend/src/main/java/com/allotcf/service/WrongQuestionService.java`
  - 支持按收藏题查询并可筛 `只看做错过的收藏题`
- Modify: `backend/src/main/java/com/allotcf/controller/WrongQuestionController.java`
  - 新增收藏练习查询接口

### 文档

- Modify: `docs/superpowers/specs/2026-05-04-wrong-question-review-design.md`
  - 如实施中发现必要的小范围修订，同步更新
- Modify: `docs/superpowers/plans/2026-05-04-wrong-question-review-implementation.md`
  - 实施时勾选步骤

## Task 1: 数据库与实体骨架

**Files:**
- Modify: `docs/schema.sql`
- Create: `backend/src/main/java/com/allotcf/entity/CanonicalQuestion.java`
- Create: `backend/src/main/java/com/allotcf/entity/UserWrongQuestion.java`
- Create: `backend/src/main/java/com/allotcf/entity/UserQuestionBookmark.java`
- Modify: `backend/src/main/java/com/allotcf/entity/Question.java`

- [ ] **Step 1: 写 schema 与实体映射的失败测试**

在 `backend/src/test/java/com/allotcf/service/PracticeServiceTest.java` 或新增 repository 层测试里增加断言，验证 `Question` 能拿到 `canonicalQuestionId`，以及用户错题 / 收藏实体可被创建。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 因缺少实体、字段或映射而失败。

- [ ] **Step 3: 增加表结构与实体**

在 `docs/schema.sql` 中增加：

- `canonical_question`
- `user_wrong_question`
- `user_question_bookmark`
- `question.canonical_question_id`
- 必要唯一索引和普通索引

同步创建 / 修改 JPA 实体。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 与实体映射相关的测试通过。

- [ ] **Step 5: Commit**

```bash
git add docs/schema.sql backend/src/main/java/com/allotcf/entity/*.java backend/src/test/java/com/allotcf/service/PracticeServiceTest.java
git commit -m "feat: add canonical question and review entities"
```

## Task 2: 导题脚本生成统一题目归并键

**Files:**
- Modify: `scripts/import_script.py`
- Modify: `scripts/tests/test_import.py`

- [ ] **Step 1: 写失败测试**

在 `scripts/tests/test_import.py` 中新增用例：

- 两道题题干不同，但 `optionA-D + correctAnswer` 相同
- 预期生成相同 `dedupe_key`
- 阅读题按分值段映射出固定难度等级：
  - `3 -> A1`
  - `9 -> A2`
  - `15 -> B1`
  - `21 -> B2`
  - `26 -> C1`
  - `33 -> C2`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_import.py -v`

Expected: dedupe key 不存在或不一致导致失败。

- [ ] **Step 3: 实现最小导题逻辑**

在 `import_script.py` 中：

- 规范化四个选项与正确答案
- 生成 dedupe key
- 按阅读题分值段生成 `difficultyLevel`
- 导入时查找 / 创建 `canonical_question`
- 将 `question` 关联到统一题目

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/scripts && source venv/bin/activate && pytest tests/test_import.py -v`

Expected: 全部通过。

- [ ] **Step 5: Commit**

```bash
git add scripts/import_script.py scripts/tests/test_import.py
git commit -m "feat: generate canonical question dedupe keys on import"
```

## Task 2.5: 统一题目补齐难度等级字段

**Files:**
- Modify: `docs/schema.sql`
- Modify: `backend/src/main/java/com/allotcf/entity/CanonicalQuestion.java`
- Modify: `backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`

- [ ] **Step 1: 写失败测试**

覆盖：

- `CanonicalQuestion` 可持有 `difficultyLevel`
- 阅读题对应的统一题目能读到 `A1 / A2 / B1 / B2 / C1 / C2`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 因缺少 `difficultyLevel` 字段或映射而失败。

- [ ] **Step 3: 写最小实现**

实现：

- 在 `canonical_question` 增加 `difficulty_level`
- 在 `CanonicalQuestion` 实体增加对应字段
- 保持阅读题现有分值规则不变，只补一层等级映射
- 如果同一道统一题目跨套出现多个等级，保存其最高等级

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add docs/schema.sql backend/src/main/java/com/allotcf/entity/CanonicalQuestion.java backend/src/test/java/com/allotcf/service/PracticeServiceTest.java
git commit -m "feat: add difficulty level to canonical questions"
```

## Task 3: 提交后累计错题并返回复盘数据

**Files:**
- Modify: `backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java`
- Modify: `backend/src/main/java/com/allotcf/dto/practice/QuestionResultDto.java`
- Modify: `backend/src/main/java/com/allotcf/service/PracticeService.java`
- Modify: `backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`

- [ ] **Step 1: 写失败测试**

在 `PracticeServiceTest` 中增加用例：

- 提交后错误题会写入 `user_wrong_question`
- 相同统一题目重复答错时 `wrongCount` 会累计
- 返回 DTO 包含：
  - `score`
  - `nclcLevelLabel`
  - 每题的题干、正文、选项、是否正确、统一题目标识、是否已收藏

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 因缺少错题累计与返回字段而失败。

- [ ] **Step 3: 实现最小服务逻辑**

在 `PracticeService` 中：

- 判分后按 `canonicalQuestionId` upsert `user_wrong_question`
- 查询收藏状态
- 组装复盘模式所需 `details`
- 保持现有分数 / CLB/NCLC 计算

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=PracticeServiceTest -q`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/allotcf/dto/practice/*.java backend/src/main/java/com/allotcf/service/PracticeService.java backend/src/test/java/com/allotcf/service/PracticeServiceTest.java
git commit -m "feat: return review payload and accumulate wrong questions"
```

## Task 4: 错题复习与收藏后端接口

**Files:**
- Create: `backend/src/main/java/com/allotcf/dto/review/WrongQuestionListItemDto.java`
- Create: `backend/src/main/java/com/allotcf/dto/review/ToggleBookmarkRequest.java`
- Create: `backend/src/main/java/com/allotcf/service/WrongQuestionService.java`
- Create: `backend/src/main/java/com/allotcf/controller/WrongQuestionController.java`
- Create: `backend/src/main/java/com/allotcf/controller/BookmarkController.java`
- Create: `backend/src/test/java/com/allotcf/service/WrongQuestionServiceTest.java`
- Create: `backend/src/test/java/com/allotcf/controller/WrongQuestionControllerTest.java`

- [ ] **Step 1: 写失败测试**

覆盖：

- 错题列表默认按 `wrongCount desc, lastWrongAt desc`
- `bookmarkedOnly=true` 仅返回已收藏
- `minWrongCount=3/5/10` 能正确过滤
- `difficultyLevels=A1,B2` 能正确过滤
- `keyword=travaille` 会在正文、题干、四个选项中匹配
- 收藏 / 取消收藏接口能正确切换状态

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=\"WrongQuestionServiceTest,WrongQuestionControllerTest\" -q`

Expected: 因接口或服务不存在而失败。

- [ ] **Step 3: 写最小实现**

实现：

- `GET /api/review/wrong-questions?type=READING&bookmarkedOnly=false&minWrongCount=0&difficultyLevels=A1,B2&keyword=travaille`
- `POST /api/review/bookmarks/{canonicalQuestionId}`
- `DELETE /api/review/bookmarks/{canonicalQuestionId}`

并补上：

- `WrongQuestionListItemDto.difficultyLevel`
- `sourceExamSets` 中每个来源显示为 `套题标题 + 题号`
- 筛选参数解析与组合过滤
- 关键词匹配范围：正文、题干、四个选项

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test -Dtest=\"WrongQuestionServiceTest,WrongQuestionControllerTest\" -q`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add backend/src/main/java/com/allotcf/dto/review backend/src/main/java/com/allotcf/service/WrongQuestionService.java backend/src/main/java/com/allotcf/controller/*.java backend/src/test/java/com/allotcf/service/WrongQuestionServiceTest.java backend/src/test/java/com/allotcf/controller/WrongQuestionControllerTest.java
git commit -m "feat: add wrong question review and bookmark endpoints"
```

## Task 5: 前端服务与类型适配

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/services/practiceService.ts`
- Create: `frontend/src/services/wrongQuestionService.ts`
- Create: `frontend/src/__tests__/services/wrongQuestionService.test.ts`

- [ ] **Step 1: 写失败测试**

覆盖：

- `submitPractice` 能解析复盘模式返回结构
- `wrongQuestionService` 能携带错题筛选参数获取列表
- 收藏 / 取消收藏请求能命中正确接口

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- wrongQuestionService practiceService`

Expected: 因类型或服务不存在而失败。

- [ ] **Step 3: 实现最小类型与服务**

新增：

- `PracticeReviewDetail`
- `WrongQuestionListItem`
- `WrongQuestionFilters`
- `wrongQuestionService`

调整 `practiceService` 以适配复盘返回结构。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- wrongQuestionService practiceService`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/services/practiceService.ts frontend/src/services/wrongQuestionService.ts frontend/src/__tests__/services/wrongQuestionService.test.ts frontend/src/__tests__/services/practiceService.test.ts
git commit -m "feat: add review and wrong question frontend services"
```

## Task 6: 答题页切换为复盘模式

**Files:**
- Modify: `frontend/src/pages/PracticePage.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- 提交后不跳 `result` 路由，而是留在当前页
- 左侧题号目录按正确 / 错误 / 未作答着色
- 右侧计时停止并改显示成绩摘要
- 选项区直接表现判分状态
- 讲解区占位出现
- 可从复盘模式收藏 / 取消收藏

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- PracticePage`

Expected: 因仍跳结果页或缺少复盘态而失败。

- [ ] **Step 3: 实现最小复盘态**

在 `PracticePage.tsx` 中增加：

- `mode: answering | review`
- 提交后写入复盘结果并切换模式
- 停止计时
- 替换右侧卡片内容
- 目录着色
- 选项判分态
- 题目级收藏书签
- 讲解占位
- 复盘态右侧显示 `返回题库` 和 `重新练习`
- `重新练习` 创建新会话并把计时器重置到 `60:00`

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- PracticePage`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/PracticePage.tsx frontend/src/index.css frontend/src/__tests__/pages/PracticePage.test.tsx
git commit -m "feat: turn practice page into post-submit review mode"
```

## Task 6.5: 题库入口状态与复盘回看

**Files:**
- Modify: `frontend/src/pages/ExamSetListPage.tsx`
- Modify: `frontend/src/utils/practicePersistence.ts`
- Modify: `frontend/src/__tests__/pages/ExamSetListPage.test.tsx`
- Modify: `frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- 已完成套题主按钮显示 `查看复盘`
- 点击 `查看复盘` 进入最近一次完成会话的复盘态
- 查看过一次复盘再回到题库页，主按钮仍保持 `查看复盘`
- 已完成状态优先级高于旧草稿
- 在复盘页点击 `重新练习` 后会创建新会话并重置为 `60:00`
- 新会话中若 `不保存并退出`，题库页仍显示 `查看复盘`

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- ExamSetListPage PracticePage`

Expected: 因题库状态优先级或复盘回看逻辑尚未完善而失败。

- [ ] **Step 3: 实现复盘回看与重新练习状态机**

实现：

- 在完成记录中持久化最近一次完成的 `sessionId`
- 题库页已完成套题优先显示 `查看复盘`
- 点击 `查看复盘` 时直接进入对应 `sessionId` 的复盘页
- 复盘页新增 `重新练习`
- 点击 `重新练习` 时清掉当前复盘态、创建新会话、重置 `60:00`
- 若新会话未保存即退出，只清理新草稿，不影响旧复盘入口

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- ExamSetListPage PracticePage`

Expected: 通过。

## Task 7: 科目与任务导航壳层

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/StudyTabs.tsx`
- Modify: `frontend/src/pages/ExamSetListPage.tsx`
- Create: `frontend/src/pages/ListeningPlaceholderPage.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/__tests__/pages/ExamSetListPage.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- 阅读 / 听力一级 tab 存在
- 阅读下有 `套题练习 / 错题复习`
- 听力页显示“即将开放”

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- ExamSetListPage`

Expected: 因导航壳层不存在而失败。

- [ ] **Step 3: 实现最小导航壳层**

新增 `StudyTabs`，让题库页挂在：

- 阅读 -> 套题练习

新增听力占位页。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- ExamSetListPage`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/App.tsx frontend/src/components/StudyTabs.tsx frontend/src/pages/ExamSetListPage.tsx frontend/src/pages/ListeningPlaceholderPage.tsx frontend/src/index.css frontend/src/__tests__/pages/ExamSetListPage.test.tsx
git commit -m "feat: add subject and task navigation shell"
```

## Task 8: 错题复习页

**Files:**
- Create: `frontend/src/pages/WrongQuestionPage.tsx`
- Modify: `frontend/src/index.css`
- Create: `frontend/src/__tests__/pages/WrongQuestionPage.test.tsx`

- [ ] **Step 1: 写失败测试**

覆盖：

- 错题列表默认按错误次数顺序渲染
- `仅看已收藏` 筛选有效
- 错误次数 `至少错 10 次 / 至少错 5 次 / 至少错 3 次 / 全部` 有效
- 难度等级 `A1-A2-B1-B2-C1-C2` 多选有效
- 关键词输入时会实时筛选
- 关键词命中后，题干、正文、选项内会出现行内高亮
- 关键词筛选刷新时，旧列表仍保持可见，不出现整页闪屏
- 左侧筛选栏固定显示，右侧为错题列表
- 卡片显示来源套题、错误次数、收藏状态

- [ ] **Step 2: 运行测试确认失败**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- WrongQuestionPage`

Expected: 因页面不存在而失败。

- [ ] **Step 3: 实现最小页面**

实现：

- 左侧固定筛选栏
- 错误次数门槛筛选
- 难度等级多选
- `仅看已收藏` 开关
- 关键词实时筛选输入框
- 对题干、正文、选项中的命中关键词做统一行内高亮
- 关键词输入时保留当前结果列表，使用轻量防抖减少频繁重刷
- 右侧错题卡片列表
- 列表顶部显示当前筛选结果数量
- 列表态只做浏览、查找、收藏，不显示提交按钮，选项不作为作答按钮
- 点击“开始复习当前结果”后进入单题复习队列
- 单题复习队列每次只显示一道题，并提供“返回列表”和右下角 `Suivant / 完成复习`
- 队列态可选择答案，点击选项后立即检查正误
- 即时检查只显示“回答正确 / 回答错误”，不计算分数或 CLB/NCLC 等级
- 空态

- [ ] **Step 4: 运行测试确认通过**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test -- WrongQuestionPage`

Expected: 通过。

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/WrongQuestionPage.tsx frontend/src/index.css frontend/src/__tests__/pages/WrongQuestionPage.test.tsx
git commit -m "feat: add wrong question review page"
```

## Task 8.5: 收藏练习页

**Status:** 已实现。

**Purpose:** 让用户集中练习所有已收藏题目，尤其覆盖“只收藏但没有答错过”的题。

**推荐入口:**

- 阅读
  - 套题练习
  - 错题复习
  - 收藏练习

如果希望入口更克制，也可以在复习任务内部把 `错题复习 / 收藏练习` 做成并列次级页签。

**核心规则:**

- 收藏练习默认展示当前用户所有收藏题
- 包含答错且收藏的题
- 包含只收藏但从未答错的题
- 不把“只收藏但未答错”的题写入错题本
- `只看做错过的收藏题` 默认关闭
- 打开 `只看做错过的收藏题` 后，只展示同时存在收藏记录与错题记录的统一题目
- 列表态只做浏览、筛选、查找、取消收藏和查看来源，不暴露正确答案
- 列表顶部显示当前筛选结果数量和“开始复习当前结果”
- 队列态每次只显示一道题，点击选项后立即检查正误
- 队列态右下角使用 `Suivant / 完成复习`，顶部保留“返回列表”

**建议接口参数:**

- `subject=READING`
- `wrongOnly=true | false`
- `difficultyLevels=A1,A2,...`
- `keyword=...`
- `page`
- `size`

**测试重点:**

- 只收藏但没有错题记录的题会出现在收藏练习默认列表中
- 只收藏但没有错题记录的题不会出现在错题复习列表中
- 打开 `只看做错过的收藏题` 后，上述题目被过滤掉
- 收藏练习关键词仍在正文、题干、选项内搜索
- 收藏练习难度等级筛选与错题复习保持一致
- 收藏练习可进入单题复习队列
- 队列中点击选项即显示“回答正确 / 回答错误”

## Task 9: 全量验证与数据回灌

**Files:**
- Modify: `docs/schema.sql`
- Modify: `scripts/import_script.py`
- Modify: 视需要修复的测试文件

- [ ] **Step 1: 重新导入阅读题并验证统一题目数量**

Run: 导题脚本到本地 `allo` 数据库，确认 `question` 与 `canonical_question` 的映射生效，并验证阅读题 `difficulty_level` 已写入。

- [ ] **Step 2: 运行后端全量测试**

Run: `cd /Users/miao/my_project/allotcf/backend && mvn test`

Expected: 全绿。

- [ ] **Step 3: 运行前端全量测试**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm test`

Expected: 全绿。

- [ ] **Step 4: 运行前端构建**

Run: `cd /Users/miao/my_project/allotcf/frontend && npm run build`

Expected: 构建通过。

- [ ] **Step 5: 本地联调**

联调重点：

- 阅读 -> 套题练习 正常进入
- 提交后原页进入复盘模式
- 左侧题号红绿状态正确
- 右侧显示成绩摘要且计时停止
- 题目级收藏书签可用
- 阅读 -> 错题复习 可看到累计错题
- 同一题跨套答错后 `wrongCount` 会增加
- 左侧固定筛选栏可按错误次数、收藏、难度等级、关键词即时过滤

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "feat: add reading review mode and wrong question workflow"
```

## 计划审查

按技能要求，计划写完后应进行一轮计划文档审查。当前会话未获得用户对并行子代理/委派的明确授权，因此这里先保留人工审阅路径。

建议人工重点检查：

- `canonical_question` 的边界是否足够稳定
- 复盘模式是否会让 `PracticePage.tsx` 过度膨胀
- 错题复习页是否需要首版分页

## 完成提示

Plan complete and saved to `docs/superpowers/plans/2026-05-04-wrong-question-review-implementation.md`. Ready to execute?
