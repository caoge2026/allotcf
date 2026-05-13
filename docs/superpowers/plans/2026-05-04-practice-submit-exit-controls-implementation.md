# 答题页提交与退出控制区实施计划

> **面向执行代理：** 必须使用 `superpowers:subagent-driven-development`（如果可用子代理）或 `superpowers:executing-plans` 来执行本计划。各步骤使用复选框语法（`- [ ]`）跟踪进度。

**Goal:** 为答题页右侧信息区增加常驻的 `提交` 和 `退出` 按钮，把最后一题的底部提交入口移除，并确保用户退出后从题库重新进入同一套题时可以恢复本地进度；正式提交后原页切入复盘态。

**Architecture:** 保持现有提交接口不变，把变更集中在 `PracticePage`、`practiceStore` 和对应样式、测试上。右侧控制区统一承担正式交卷和退出流程，中间底部按钮只保留顺序前进职责；退出通过页面内自定义确认弹层决定是留在本页、不保存退出，还是保存进度退出。本地草稿以 `examSetId` 为主键保存答案、当前题号和暂停时剩余时间，`sessionId` 只负责页面刷新时找回所属套题。正式提交后当前页切入复盘态，倒计时停止。

**Tech Stack:** React 18、TypeScript、Vitest、CSS、React Router

---

## 文件结构

- 修改：`frontend/src/pages/PracticePage.tsx`
  职责：新增右侧 `提交 / 退出` 控制、自定义退出确认弹层、按套题恢复本地进度、最后一题隐藏底部按钮。
- 修改：`frontend/src/index.css`
  职责：补右侧控制按钮样式和自定义确认弹层样式，并让按钮与当前绿色书卷风一致。
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`
  职责：验证右侧提交、退出弹层、退出返回、按套题恢复进度和最后一题隐藏底部按钮。
- 修改：`frontend/src/stores/practiceStore.ts`
  职责：支持恢复当前题号。
- 修改：`frontend/src/__tests__/stores/practiceStore.test.ts`
  职责：验证 store 可恢复当前题号。

## 任务 1：先用测试锁住新增控制逻辑

**文件：**
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **步骤 1：补失败测试，要求右侧显示提交和退出按钮**

新增测试覆盖：
- 页面右侧存在 `提交`
- 页面右侧存在 `退出`

- [x] **步骤 2：补失败测试，要求点击退出会确认并跳回题库**

新增测试覆盖：
- 点击 `退出` 时显示页面内确认弹层
- 点击 `保存当前进度并退出` 后返回 `题库页`
- 点击 `不保存并退出` 后返回 `题库页` 且草稿被清除
- 点击“留在本页”后关闭弹层并停留

- [x] **步骤 3：补失败测试，要求重新进入同一套题时恢复进度**

新增测试覆盖：
- 即使拿到新的 `sessionId`
- 仍能按 `examSetId` 恢复已作答答案、当前题号和倒计时

- [x] **步骤 4：补失败测试，要求最后一题不再显示底部推进按钮**

新增测试覆盖：
- 跳到最后一题时，中间底部不再显示 `Suivant`

- [x] **步骤 5：运行答题页测试，确认先失败**

运行：`cd frontend && npm test -- PracticePage`
预期：测试失败，提示页面还没有右侧退出逻辑或最后一题仍显示底部按钮

## 任务 2：实现右侧提交与退出控制区

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/index.css`

- [ ] **步骤 1：在右侧信息区下方增加常驻按钮结构**

实现：
- 主按钮 `提交`
- 次按钮 `退出`

- [ ] **步骤 2：让右侧提交按钮复用现有提交流程**

实现：
- 点击时先保存当前题选择
- 调用已有 `handleSubmit`
- 提交过程中进入禁用态
- 提交成功后停留当前页并切入复盘态

- [x] **步骤 3：实现退出确认逻辑**

实现：
- 点击 `退出` 打开页面内确认弹层
- 点击 `保存当前进度并退出` 时保存当前题、保留本地草稿、跳到 `/exam-sets`
- 点击 `不保存并退出` 时删除草稿并跳到 `/exam-sets`
- 点击 `留在本页` 时关闭弹层并留在当前页

- [x] **步骤 4：把本地草稿主键改为 `examSetId` 并恢复当前题号**

实现：
- 本地草稿保存答案、暂停时剩余时间和当前题号
- 重新进入同一套题时，即使 `sessionId` 改变也能恢复
- 正式提交后清掉该套题草稿

- [x] **步骤 5：最后一题隐藏中间底部按钮**

实现：
- 非最后一题显示 `Suivant`
- 最后一题不显示底部推进按钮

- [x] **步骤 6：补控制区与确认弹层样式**

实现：
- 右侧控制按钮与倒计时卡保持统一语言
- `退出` 使用较弱的次级按钮样式

- [x] **步骤 7：重新运行答题页测试**

运行：`cd frontend && npm test -- PracticePage`
预期：新增测试通过

## 任务 3：完整验证

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/index.css`
- 修改：`frontend/src/__tests__/pages/PracticePage.test.tsx`

- [x] **步骤 1：运行完整前端测试**

运行：`cd frontend && npm test`
预期：所有前端测试通过

- [x] **步骤 2：运行生产构建**

运行：`cd frontend && npm run build`
预期：构建成功

- [x] **步骤 3：浏览器手动验证**

验证：
- 作答态右侧存在 `提交` 和 `退出`
- 点击 `提交` 后原页进入复盘态
- 点击 `退出` 会出现自定义确认弹层
- 点击 `保存当前进度并退出` 后回到题库列表页
- 点击 `不保存并退出` 后回到题库列表页且草稿被清理
- 从题库重新进入同一套题后，当前题号、答案和剩余时间都能恢复
- 最后一题不再显示底部按钮

- [ ] **步骤 4：提交代码**

```bash
git add frontend/src/pages/PracticePage.tsx frontend/src/index.css frontend/src/__tests__/pages/PracticePage.test.tsx docs/superpowers/specs/2026-05-04-practice-submit-exit-controls-design.md docs/superpowers/plans/2026-05-04-practice-submit-exit-controls-implementation.md
git commit -m "feat: add submit and exit controls to practice page"
```
