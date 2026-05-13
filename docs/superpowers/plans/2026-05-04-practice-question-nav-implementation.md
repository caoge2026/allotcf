# 答题页左侧题号导航实施计划

> **面向执行代理：** 必须使用 `superpowers:subagent-driven-development`（如果可用子代理）或 `superpowers:executing-plans` 来执行本计划。各步骤使用复选框语法（`- [ ]`）跟踪进度。

**目标：** 为答题页增加可自由跳转的左侧题号导航，并在跳题时自动保存当前选择。

**架构：** 保持现有答题 API 和整体提交流程不变，把改造集中在前端 `practiceStore` 与 `PracticePage`。状态层新增显式跳题能力，页面层统一处理“保存当前题 + 跳转 / 下一题 / 提交”的行为，并通过共享样式扩展左侧导航布局。

**技术栈：** React 18、TypeScript、Zustand、Vitest、CSS

---

## 文件结构

- 修改：`frontend/src/stores/practiceStore.ts`
  职责：增加跳转到指定题目的状态方法，并保持现有答题状态模型清晰可测。
- 修改：`frontend/src/pages/PracticePage.tsx`
  职责：实现左侧题号导航、自动保存当前选择、已答题回填、顺序下一题与自由跳题共用保存逻辑。
- 修改：`frontend/src/index.css`
  职责：补充答题页双栏布局、题号导航、题号状态与移动端适配样式。
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`
  职责：补充跳题相关状态测试。
- 新增：`frontend/src/__tests__/pages/PracticePage.test.tsx`
  职责：验证自动保存、自由跳题、已答题回填和提交流程。

## 任务 1：扩展答题状态仓库

**文件：**
- 修改：`frontend/src/stores/practiceStore.ts`
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`

- [ ] **步骤 1：先阅读当前答题状态测试，确认现有覆盖范围**

阅读：`frontend/src/__tests__/stores/practiceStore.test.ts`

- [ ] **步骤 2：先写一个失败测试，要求 store 支持跳到指定题目**

新增测试覆盖：
- `goToQuestion(index)` 能把 `currentIndex` 切到目标题
- 不影响已保存答案

- [ ] **步骤 3：运行 store 测试，确认新增测试先失败**

运行：`cd frontend && npm test -- practiceStore`
预期：新增测试失败，提示 `goToQuestion` 不存在或行为不匹配

- [ ] **步骤 4：在 practiceStore 中补充最小实现**

实现：
- 新增 `goToQuestion(index)` 方法
- 限制索引不能越界
- 保持 `answers`、`sessionId`、`questions` 不被误改

- [ ] **步骤 5：重新运行 store 测试**

运行：`cd frontend && npm test -- practiceStore`
预期：`practiceStore` 相关测试全部通过

## 任务 2：给答题页补上自由跳题行为

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 新增：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：先写答题页失败测试，覆盖题号导航的关键行为**

新增测试覆盖：
- 点击别的题号前会自动保存当前已选答案
- 跳转到别题后，再返回原题可以看到已保存答案
- 点击已答题号时会正确回填选项
- 最后一题提交前仍会保存当前题答案

- [ ] **步骤 2：运行答题页测试，确认新增测试先失败**

运行：`cd frontend && npm test -- PracticePage`
预期：测试失败，提示页面还没有题号导航或自动保存行为

- [ ] **步骤 3：在页面中抽出“保存当前题”的共享逻辑**

实现：
- 根据 `currentQuestion`、`selected`、`startTimeRef` 计算保存内容
- 允许在跳题、下一题、提交之前复用
- 如果当前题没有选择，不强行写入空答案

- [ ] **步骤 4：在页面中补上“切题后回填已保存答案”逻辑**

实现：
- 当 `currentIndex` 或 `answers` 变化时，从 `answers[currentQuestion.id]` 回填当前选项
- 没有记录时清空本地 `selected`

- [ ] **步骤 5：把“下一题”改成共用保存逻辑**

实现：
- 继续要求当前题已选择才能推进
- 先保存，再跳到下一题
- 如果是最后一题，先保存再提交

- [ ] **步骤 6：实现点击题号跳转逻辑**

实现：
- 渲染题号列表
- 点击时先保存当前已选答案
- 再调用 `goToQuestion(index)`

- [ ] **步骤 7：重新运行答题页测试**

运行：`cd frontend && npm test -- PracticePage`
预期：新增答题页测试通过

## 任务 3：补上左侧题号导航视觉系统

**文件：**
- 修改：`frontend/src/index.css`
- 修改：`frontend/src/pages/PracticePage.tsx`

- [ ] **步骤 1：先在页面结构中引入双栏答题布局**

应用：
- 左侧固定题号导航区
- 右侧正文答题区
- 顶部进度信息与当前书卷风保持一致

- [ ] **步骤 2：为题号按钮定义三态样式**

实现：
- 当前题：深绿色高亮
- 已作答题：浅绿色底色
- 未作答题：默认纸面态

- [ ] **步骤 3：补移动端适配**

实现：
- 小屏下左侧目录转成上方网格区
- 不挤压正文阅读区
- 按钮仍然易点选

- [ ] **步骤 4：运行生产构建，确认样式和 TS 都正常**

运行：`cd frontend && npm run build`
预期：构建成功

## 任务 4：完整回归验证

**文件：**
- 修改：`frontend/src/stores/practiceStore.ts`
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/index.css`
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`
- 新增：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：运行完整前端测试**

运行：`cd frontend && npm test`
预期：所有前端测试通过

- [ ] **步骤 2：运行生产构建**

运行：`cd frontend && npm run build`
预期：构建成功

- [ ] **步骤 3：在浏览器里手动验证真实答题流程**

验证：
- 左侧题号区可见且顺序正确
- 可点击未作答题直接跳转
- 切题时会自动保存当前选择
- 返回已答题时能看到之前的答案
- 最后一题提交仍然正常
- 移动端宽度下布局不崩

- [ ] **步骤 4：提交代码**

```bash
git add frontend/src/stores/practiceStore.ts frontend/src/pages/PracticePage.tsx frontend/src/index.css frontend/src/__tests__/stores/practiceStore.test.ts frontend/src/__tests__/pages/PracticePage.test.tsx docs/superpowers/specs/2026-05-04-practice-question-nav-design.md docs/superpowers/plans/2026-05-04-practice-question-nav-implementation.md
git commit -m "feat: add question navigation to practice page"
```
