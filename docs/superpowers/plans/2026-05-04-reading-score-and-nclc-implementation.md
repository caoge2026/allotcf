# 阅读分数与 NCLC 区间实施计划

> **面向执行代理：** 必须使用 `superpowers:subagent-driven-development`（如果可用子代理）或 `superpowers:executing-plans` 来执行本计划。各步骤使用复选框语法（`- [ ]`）跟踪进度。

**目标：** 在阅读练习提交后计算总分，并返回对应的 NCLC 区间。

**架构：** 后端统一负责阅读计分和 NCLC 映射，前端结果页只展示后端返回的 `score` 与 `nclcLevelLabel`。计分规则以题目的 `sequenceOrder` 为准，避免依赖 `question_no` 的文本格式；刷新结果页时通过 `getResult` 重新计算并保持一致。

**技术栈：** Spring Boot、Java、JUnit、React、TypeScript、Vitest

---

## 文件结构

- 修改：`backend/src/main/java/com/allotcf/service/PracticeService.java`
  职责：统一实现阅读总分计算和 NCLC 区间映射。
- 修改：`backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java`
  职责：补充 `score` 和 `nclcLevelLabel` 字段。
- 修改：`backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`
  职责：验证计分规则和 NCLC 映射。
- 修改：`frontend/src/types/index.ts`
  职责：扩展结果类型，接收 `score` 和 `nclcLevelLabel`。
- 修改：`frontend/src/pages/ResultPage.tsx`
  职责：展示总分和 NCLC 区间。
- 修改：`frontend/src/__tests__/pages/ResultPage.test.tsx`
  职责：验证结果页正确展示新字段。

## 任务 1：先用测试锁住后端计分规则

**文件：**
- 修改：`backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`

- [ ] **步骤 1：补一个失败测试，验证正确答案会累计区间分值**

新增测试覆盖：
- 第 1 题答对加 `3`
- 第 5 题答对加 `9`
- 第 11 题答对加 `15`
- 第 20`/`30`/`36` 等边界题加对应分值

- [ ] **步骤 2：补一个失败测试，验证总分映射到 NCLC**

新增测试覆盖：
- 高分能映射到 `NCLC 10`
- 低于 `342` 显示 `NCLC 4 以下`

- [ ] **步骤 3：运行后端计分测试，确认先失败**

运行：`cd backend && mvn test -Dtest=PracticeServiceTest`
预期：测试失败，提示 DTO 或 service 尚未实现新字段/新规则

## 任务 2：实现后端计分与 NCLC 映射

**文件：**
- 修改：`backend/src/main/java/com/allotcf/service/PracticeService.java`
- 修改：`backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java`

- [ ] **步骤 1：在 PracticeResultDto 中增加结果字段**

新增：
- `score`
- `nclcLevelLabel`

- [ ] **步骤 2：在 PracticeService 中补充题号分值规则**

实现：
- `1-4` => `3`
- `5-10` => `9`
- `11-19` => `15`
- `20-29` => `21`
- `30-35` => `26`
- `36-39` => `33`

- [ ] **步骤 3：按 sequenceOrder 计算正确题得分**

实现：
- 只对答对题累计分值
- 未作答或答错不计分

- [ ] **步骤 4：实现总分到 NCLC 的映射函数**

实现：
- `549-699` => `NCLC 10`
- `524-548` => `NCLC 9`
- `499-523` => `NCLC 8`
- `453-498` => `NCLC 7`
- `406-452` => `NCLC 6`
- `375-405` => `NCLC 5`
- `342-374` => `NCLC 4`
- `< 342` => `NCLC 4 以下`

- [ ] **步骤 5：让 submit 和 getResult 都返回同样的分数与区间**

实现：
- 提交时返回 `score` 和 `nclcLevelLabel`
- 重查结果时也返回同样字段

- [ ] **步骤 6：重新运行后端计分测试**

运行：`cd backend && mvn test -Dtest=PracticeServiceTest`
预期：测试通过

## 任务 3：扩展前端结果类型和结果页

**文件：**
- 修改：`frontend/src/types/index.ts`
- 修改：`frontend/src/pages/ResultPage.tsx`
- 修改：`frontend/src/__tests__/pages/ResultPage.test.tsx`

- [ ] **步骤 1：先补失败测试，要求结果页显示总分与 NCLC**

新增测试覆盖：
- 页面显示 `score`
- 页面显示 `nclcLevelLabel`

- [ ] **步骤 2：运行结果页测试，确认先失败**

运行：`cd frontend && npm test -- ResultPage`
预期：测试失败，提示结果页还未展示新字段

- [ ] **步骤 3：扩展前端 PracticeResult 类型**

新增：
- `score`
- `nclcLevelLabel`

- [ ] **步骤 4：在结果页中展示分数与 NCLC**

展示原则：
- 保留 `correct / total`
- 增加总分
- 增加 NCLC 区间

- [ ] **步骤 5：重新运行结果页测试**

运行：`cd frontend && npm test -- ResultPage`
预期：测试通过

## 任务 4：完整验证

**文件：**
- 修改：`backend/src/main/java/com/allotcf/service/PracticeService.java`
- 修改：`backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java`
- 修改：`backend/src/test/java/com/allotcf/service/PracticeServiceTest.java`
- 修改：`frontend/src/types/index.ts`
- 修改：`frontend/src/pages/ResultPage.tsx`
- 修改：`frontend/src/__tests__/pages/ResultPage.test.tsx`

- [ ] **步骤 1：运行后端相关测试**

运行：`cd backend && mvn test -Dtest=PracticeServiceTest`
预期：通过

- [ ] **步骤 2：运行前端完整测试**

运行：`cd frontend && npm test`
预期：所有前端测试通过

- [ ] **步骤 3：运行前端构建**

运行：`cd frontend && npm run build`
预期：构建成功

- [ ] **步骤 4：手动验证结果页**

验证：
- 提交后能看到总分
- 提交后能看到 NCLC 区间
- 重新进入结果页时数据一致

- [ ] **步骤 5：提交代码**

```bash
git add backend/src/main/java/com/allotcf/service/PracticeService.java backend/src/main/java/com/allotcf/dto/practice/PracticeResultDto.java backend/src/test/java/com/allotcf/service/PracticeServiceTest.java frontend/src/types/index.ts frontend/src/pages/ResultPage.tsx frontend/src/__tests__/pages/ResultPage.test.tsx docs/superpowers/specs/2026-05-04-reading-score-and-nclc-design.md docs/superpowers/plans/2026-05-04-reading-score-and-nclc-implementation.md
git commit -m "feat: calculate reading scores and nclc levels"
```
