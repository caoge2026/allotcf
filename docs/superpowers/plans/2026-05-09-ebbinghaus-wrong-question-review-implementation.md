# 艾宾浩斯错题复习计划实施记录

## 目标

为阅读错题本增加基于艾宾浩斯间隔的 `今日复习` 任务视图，让系统自动安排逾期题和今日到期题，并在错题复习队列中根据用户答题结果更新下一次复习时间。

## 已实现范围

- 扩展 `user_wrong_question` 复习计划字段。
- 错题列表 DTO 返回 `reviewStage`、`nextReviewAt`、`dueStatus`、`overdueDays`。
- 新增 `GET /api/review/today-wrong-questions`。
- 新增 `POST /api/review/wrong-questions/{canonicalQuestionId}/attempt`。
- 提交套题时，答错题会初始化或重置复习计划。
- 错题复习队列中选择答案后立即判定正误，并同步更新复习计划。
- 错题本前端增加 `今日复习 / 全部错题` 主视图。
- 今日复习空态提供 `查看全部错题` 入口。
- 题目卡片展示到期状态。
- 错题列表 DTO 返回 `mastered`，前端可展示 `已掌握` 徽标。
- 错题列表和今日复习接口支持 `masteryStatus=ACTIVE|MASTERED|ALL`。
- 前端左侧掌握状态筛选只暴露 `未掌握 / 已掌握`，避免与顶部 `今日复习 / 全部错题` 入口重复。
- 默认错题列表和今日复习只展示 `未掌握` 题目。
- `reviewStage >= 4` 的题目视为 `已掌握`，从默认复习队列中退出；再次答错后可回到未掌握队列。
- 今日复习概览增加 `逾期题`、`预计用时`、`今日已完成`、`高频错题（>=5次）`。
- `今日已完成` 表示本次今日复习中已提交并答对的题目数，按本地日期保存在浏览器中，刷新后继续保留。
- `已掌握` 筛选无数据时展示说明性空态，告知用户达到第 4 阶段后题目会进入已掌握。
- 新增 MySQL 迁移脚本 `scripts/deploy/2026-05-09-ebbinghaus-review-plan.sql`。

## 关键实现文件

- `backend/src/main/java/com/allotcf/entity/UserWrongQuestion.java`
- `backend/src/main/java/com/allotcf/dto/review/WrongQuestionListItemDto.java`
- `backend/src/main/java/com/allotcf/dto/review/ReviewQuestionAttemptRequest.java`
- `backend/src/main/java/com/allotcf/repository/UserWrongQuestionRepository.java`
- `backend/src/main/java/com/allotcf/service/WrongQuestionService.java`
- `backend/src/main/java/com/allotcf/service/PracticeService.java`
- `backend/src/main/java/com/allotcf/controller/WrongQuestionController.java`
- `frontend/src/services/wrongQuestionService.ts`
- `frontend/src/pages/WrongQuestionPage.tsx`
- `frontend/src/types/index.ts`
- `frontend/src/index.css`

## 数据库迁移

执行：

```sql
ALTER TABLE user_wrong_question
  ADD COLUMN review_stage INT NOT NULL DEFAULT 0,
  ADD COLUMN next_review_at DATETIME NULL,
  ADD COLUMN last_reviewed_at DATETIME NULL,
  ADD COLUMN last_review_result VARCHAR(16) NULL;

UPDATE user_wrong_question
SET next_review_at = DATE_ADD(DATE(last_wrong_at), INTERVAL 1 DAY)
WHERE next_review_at IS NULL;

CREATE INDEX idx_user_wrong_question_review_due
  ON user_wrong_question (user_id, next_review_at);
```

完整脚本位于：

```text
scripts/deploy/2026-05-09-ebbinghaus-review-plan.sql
```

## 接口与状态规则

### 掌握状态

`masteryStatus` 当前支持三种值：

- `ACTIVE`：未掌握，`reviewStage < 4`。
- `MASTERED`：已掌握，`reviewStage >= 4`。
- `ALL`：全部掌握状态，后端保留给未来管理视图或调试使用。

产品界面只展示 `未掌握 / 已掌握` 两个筛选项，不展示 `全部 / 不限状态`。`全部错题` 作为顶部主视图保留，避免左侧筛选和顶部视图重复表达同一个概念。

### 今日复习

`GET /api/review/today-wrong-questions` 与 `GET /api/review/wrong-questions` 使用一致的筛选语义，包含：

- `bookmarkedOnly`
- `minWrongCount`
- `difficultyLevels`
- `keyword`
- `masteryStatus`

今日复习默认传入 `masteryStatus=ACTIVE`。当用户切换到 `已掌握` 时，今日复习也会按已掌握状态过滤，保证左侧筛选能立即影响下方题目列表。

### 错题出口

错题不会因为答对一次而从错题本中删除。

当前出口规则：

- 答对后 `reviewStage + 1`。
- 达到第 4 阶段后进入 `已掌握`。
- 已掌握题默认不再出现在今日复习和默认错题列表中。
- 如果再次答错，`reviewStage` 会下降；低于第 4 阶段后重新进入未掌握队列。

这套规则降低了“蒙对一次就消失”的风险，同时保留用户的长期复习成果。

## 验证记录

已通过：

```bash
cd backend
mvn test -Dtest=WrongQuestionServiceTest,PracticeServiceTest
```

结果：

```text
Tests run: 11, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

已通过：

```bash
cd frontend
npm test -- WrongQuestionPage.test.tsx wrongQuestionService.test.ts --run
npm run build
```

结果：

```text
WrongQuestionPage.test.tsx: passed
wrongQuestionService.test.ts: passed
合计 26 passed
npm run build: built successfully
```

## 后续可扩展方向

- 日历视图。
- 连续复习提醒。
- 更细的掌握度评分。
- 自定义复习间隔。
