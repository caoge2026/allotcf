# 答题页版式与倒计时调整实施计划

> **面向执行代理：** 必须使用 `superpowers:subagent-driven-development`（如果可用子代理）或 `superpowers:executing-plans` 来执行本计划。各步骤使用复选框语法（`- [ ]`）跟踪进度。

**目标：** 调整答题页版式，并加入基于开始时间持续计算的 60 分钟倒计时与本地草稿恢复。

**架构：** 保持现有后端接口不变，在前端答题页内补齐两类能力：一类是视觉布局调整，另一类是带本地持久化的答题会话状态恢复。通过 `sessionId` 关联本地保存的 `examSetId`、开始时间和答案草稿，使刷新后仍能恢复题目、准确剩余时间和已做答案；提交成功或时间耗尽后，统一清理本地会话状态。

**技术栈：** React 18、TypeScript、Zustand、Vitest、CSS、localStorage

---

## 文件结构

- 修改：`frontend/src/pages/PracticePage.tsx`
  职责：实现右侧倒计时信息区、恢复刷新后的答题上下文和答案草稿、自动提交、按钮位置与文案调整。
- 修改：`frontend/src/index.css`
  职责：补更宽的三栏布局、正文固定高度加内部滚动、右侧计时卡片、左对齐选项与按钮对齐样式。
- 修改：`frontend/src/stores/practiceStore.ts`
  职责：支持用初始草稿答案启动会话，避免刷新后再次重置答案。
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`
  职责：验证会话启动时可以带入初始答案。
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`
  职责：验证刷新恢复、草稿答案恢复、倒计时恢复、自动提交和按钮文案。

## 任务 1：补齐答题会话的本地恢复与草稿恢复能力

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/stores/practiceStore.ts`
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：先写失败测试，覆盖刷新后恢复答题上下文**

新增测试覆盖：
- 当路由 `state` 中没有 `examSetId` 时，若本地存在当前 `sessionId` 对应的 `examSetId`，页面仍能恢复题目
- 首次进入时会把当前 `sessionId` 的 `examSetId` 和开始时间写入本地
- 当本地存在当前 `sessionId` 对应的答案草稿时，页面会把草稿答案回填到对应题目
- `practiceStore.startSession(...)` 支持带入初始答案

- [ ] **步骤 2：运行答题页测试，确认新增测试先失败**

运行：`cd frontend && npm test -- PracticePage`
预期：测试失败，提示没有恢复逻辑或仍被重定向

- [ ] **步骤 3：在 PracticePage 中增加会话本地存储辅助函数**

实现：
- 以 `sessionId` 为键保存 `examSetId`
- 以 `sessionId` 为键保存开始时间
- 以 `sessionId` 为键保存答案草稿
- 提交成功后清理对应本地记录

- [ ] **步骤 4：让页面优先使用路由中的 `examSetId`，缺失时回退到本地记录**

实现：
- 正常从 `location.state` 读取
- 若缺失则尝试从本地恢复
- 会话启动时把本地答案草稿一并带入
- 两者都没有时再跳回题库

- [ ] **步骤 5：重新运行答题页测试**

运行：`cd frontend && npm test -- PracticePage`
预期：恢复相关测试通过

## 任务 2：加入持续计算的 60 分钟倒计时

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：先写失败测试，覆盖倒计时恢复与时间耗尽自动提交**

新增测试覆盖：
- 页面会显示剩余时间
- 若本地已记录开始时间，则按该时间计算而不是重置为 60 分钟
- 时间归零时会触发提交

- [ ] **步骤 2：运行答题页测试，确认测试先失败**

运行：`cd frontend && npm test -- PracticePage`
预期：测试失败，提示没有倒计时或没有自动提交

- [ ] **步骤 3：在页面中实现剩余时间状态与格式化逻辑**

实现：
- 总时长固定 3600 秒
- 每秒根据 `Date.now() - startedAt` 计算剩余秒数
- 格式化成 `MM:SS`

- [ ] **步骤 4：在时间归零时自动保存并提交**

实现：
- 若当前题已有选择，先保存
- 防止重复触发提交
- 提交成功后清理本地倒计时记录

- [ ] **步骤 5：重新运行答题页测试**

运行：`cd frontend && npm test -- PracticePage`
预期：倒计时相关测试通过

## 任务 3：调整答题页版式与交互文案

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/index.css`

- [ ] **步骤 1：把桌面端答题页改成三栏布局**

应用：
- 左侧题号导航
- 中间更宽的正文区
- 右侧考试信息区

- [ ] **步骤 2：固定正文卡片的最小高度**

实现：
- 阅读材料区使用固定高度
- 内容过长时启用内部纵向滚动
- 不再继续撑高页面

- [ ] **步骤 3：让选项内容统一左对齐**

实现：
- 选项按钮内部改成左对齐排列
- 字母标识与文本形成稳定的阅读起点

- [ ] **步骤 4：调整主按钮位置和文案**

实现：
- 非最后一题文案改为 `Suivant`
- 按钮靠右
- 最后一题继续保留提交语义

- [ ] **步骤 5：补上右侧倒计时信息卡样式**

实现：
- 显示剩余时间
- 显示总题数与当前进度
- 与当前绿色书卷风一致

- [ ] **步骤 6：运行生产构建**

运行：`cd frontend && npm run build`
预期：构建成功

## 任务 4：完整验证

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/index.css`
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：运行完整前端测试**

运行：`cd frontend && npm test`
预期：所有前端测试通过

- [ ] **步骤 2：运行生产构建**

运行：`cd frontend && npm run build`
预期：构建成功

- [ ] **步骤 3：在浏览器里手动验证真实流程**

验证：
- 正文区更宽
- 正文区固定高度且内部滚动
- 选项内容左对齐
- `Suivant` 按钮靠右
- 右侧显示剩余时间
- 刷新后题目与倒计时仍可恢复
- 刷新后本地草稿答案可恢复
- 提交成功后计时结束

- [ ] **步骤 4：提交代码**

```bash
git add frontend/src/pages/PracticePage.tsx frontend/src/index.css frontend/src/__tests__/pages/PracticePage.test.tsx docs/superpowers/specs/2026-05-04-practice-layout-and-timer-design.md docs/superpowers/plans/2026-05-04-practice-layout-and-timer-implementation.md
git commit -m "feat: add persistent timer and layout polish to practice page"
```
