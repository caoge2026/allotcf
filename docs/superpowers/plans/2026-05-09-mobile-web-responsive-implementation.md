# Mobile Web Responsive Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 AllôTCF 在手机浏览器中支持核心学习路径：固定底部工具栏、弹层目录、单列作答/复盘，以及错题/收藏练习的移动端复习队列。

**Architecture:** 保持桌面端现有三栏和双栏结构，在 React 页面中增加少量移动端专用状态和语义化入口，并通过 CSS 媒体查询在小屏幕下切换为单列布局。手机端目录使用同一套题号数据渲染到弹层，避免与桌面侧栏重复业务逻辑。

**Tech Stack:** React、TypeScript、Vite、Vitest、Testing Library、CSS media queries。

---

## 文件结构

- 修改 `frontend/src/pages/PracticePage.tsx`：增加手机端底部工具栏、题号目录弹层、复盘态移动入口。
- 修改 `frontend/src/pages/WrongQuestionPage.tsx`：增加移动端队列底部工具栏和筛选弹层入口。
- 修改 `frontend/src/pages/BookmarkedQuestionPage.tsx`：与错题复习保持同构的移动端底部工具栏和筛选弹层入口。
- 修改 `frontend/src/index.css`：增加手机端响应式规则、固定底部工具栏、移动端弹层目录、移动端队列布局。
- 修改 `frontend/src/__tests__/pages/PracticePage.test.tsx`：覆盖移动端目录弹层打开、题号跳转、底部工具栏关键入口。
- 修改 `frontend/src/__tests__/pages/WrongQuestionPage.test.tsx`：覆盖错题和收藏练习的移动端筛选弹层入口、队列底部入口。
- 参考 `docs/superpowers/specs/2026-05-09-mobile-web-responsive-design.md`。

## Task 1: 套题作答页移动端目录和底部工具栏

**Files:**
- Modify: `frontend/src/pages/PracticePage.tsx`
- Modify: `frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **Step 1: 写失败测试**

在 `PracticePage.test.tsx` 增加测试：渲染作答页后，应存在手机端底部工具栏按钮 `目录`、`退出`，并在题目右上角存在题目级书签按钮；点击 `目录` 打开题号弹层，点击 `02` 跳到第二题并关闭弹层。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm test -- PracticePage.test.tsx`

Expected: FAIL，因为页面尚未渲染移动端目录弹层或底部工具栏。

- [ ] **Step 3: 实现最小交互**

在 `PracticePage.tsx` 中增加：

- `const [isQuestionDrawerOpen, setIsQuestionDrawerOpen] = useState(false)`
- 移动端底部工具栏 `<nav className="mobile-practice-toolbar">`
- 目录弹层 `<div className="mobile-question-drawer">`
- 目录题号按钮复用 `handleJump(index)`，点击后关闭弹层。

作答态工具栏包含 `目录`、剩余时间、提交、退出。`提交` 会保存当前选择并提交整套题，随后进入原页复盘态。收藏不进入底部工具栏，统一放在题目右上角的小书签中；普通作答详情需要带上 `canonicalQuestionId` 和当前用户收藏状态，以便做题中也可以收藏 / 取消收藏。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm test -- PracticePage.test.tsx`

Expected: PASS。

## Task 2: 套题复盘页移动端状态颜色和操作入口

**Files:**
- Modify: `frontend/src/pages/PracticePage.tsx`
- Modify: `frontend/src/__tests__/pages/PracticePage.test.tsx`

- [ ] **Step 1: 写失败测试**

增加测试：复盘页点击手机端 `目录` 后，弹层题号应包含正确/错误状态 class；复盘态底部工具栏应显示 `成绩`、`返回题库`、`重新练习`，收藏由题目右上角书签承担。点击 `成绩` 后打开成绩弹层，正文区域不常驻显示移动端结果卡。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm test -- PracticePage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现复盘态移动入口**

在移动端工具栏中根据 `isReviewMode` 切换工具项：

- `目录` 打开复盘题号弹层。
- `成绩` 打开移动端成绩弹层，展示正确题数、正确率、总分和 CLB/NCLC 等级。
- `返回题库` 在复盘态返回题库列表。
- `重新练习` 复用桌面端重练逻辑，清空当前复盘态并创建新练习会话。

收藏 / 取消收藏调用同一个题目右上角书签按钮，不再放入移动端底部工具栏。

弹层题号按钮复用桌面复盘状态：`review-correct`、`review-wrong`、`review-unanswered`、`active`。

手机端复盘正文区不再常驻显示结果卡，避免窄屏空间被成绩信息占用；成绩只通过底部 `成绩` 按钮按需查看。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm test -- PracticePage.test.tsx`

Expected: PASS。

## Task 3: 手机端 CSS 布局和视觉

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: 增加响应式 CSS**

在 `@media (max-width: 920px)` 中调整：

- `.practice-layout` 宽度为小屏安全宽度。
- `.practice-grid` 单列。
- `.practice-nav` 和 `.practice-sidecard` 在手机端隐藏，避免和底部工具栏重复。
- `.practice-sheet` 增加底部 padding，避免固定工具栏遮挡。
- `.passage-card` 使用 `max-height` 或更适合手机的高度。
- `.question-title` 减小字号。

- [ ] **Step 2: 增加移动端工具栏和弹层 CSS**

新增：

- `.mobile-practice-toolbar`
- `.mobile-practice-tool`
- `.mobile-question-drawer-scrim`
- `.mobile-question-drawer`
- `.mobile-question-drawer-grid`

底部工具栏使用 `position: fixed; bottom: 0; padding-bottom: env(safe-area-inset-bottom);`。

- [ ] **Step 3: 构建验证**

Run: `cd frontend && npm run build`

Expected: PASS。

## Task 4: 错题复习移动端筛选弹层和底部工具栏

**Files:**
- Modify: `frontend/src/pages/WrongQuestionPage.tsx`
- Modify: `frontend/src/__tests__/pages/WrongQuestionPage.test.tsx`

- [ ] **Step 1: 写失败测试**

增加测试：进入错题复习队列后，应显示移动端底部工具栏按钮 `列表`、`筛选`、`退出`，并在题目卡右上角显示书签按钮；点击 `筛选` 打开筛选弹层；点击 `列表` 返回列表态。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm test -- WrongQuestionPage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现错题移动端入口**

在 `WrongQuestionPage.tsx` 中增加：

- `const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false)`
- 将筛选内容包裹为可复用片段，桌面侧栏和手机弹层共用。
- 队列态底部增加 `.mobile-review-toolbar`。
- `列表` 设置 `setReviewQueueActive(false)`。
- `筛选` 打开筛选弹层。
- `退出` 返回列表态。

收藏调用当前题卡片右上角的 `toggleBookmark(currentReviewItem)`，不进入底部工具栏。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm test -- WrongQuestionPage.test.tsx`

Expected: PASS。

## Task 5: 收藏练习移动端同构改造

**Files:**
- Modify: `frontend/src/pages/BookmarkedQuestionPage.tsx`
- Modify: `frontend/src/__tests__/pages/WrongQuestionPage.test.tsx`

- [ ] **Step 1: 写失败测试**

在收藏练习测试中增加：进入收藏复习队列后，应显示 `列表`、`筛选`、`退出`，并在题目卡右上角显示已收藏书签；点击 `筛选` 打开收藏筛选弹层。

- [ ] **Step 2: 运行测试确认失败**

Run: `cd frontend && npm test -- WrongQuestionPage.test.tsx`

Expected: FAIL。

- [ ] **Step 3: 实现收藏练习移动端入口**

在 `BookmarkedQuestionPage.tsx` 中按错题页同构实现：

- 移动端筛选弹层。
- 队列底部工具栏。
- 题目右上角书签继续复用 `toggleBookmark(currentReviewItem)`。

- [ ] **Step 4: 运行测试确认通过**

Run: `cd frontend && npm test -- WrongQuestionPage.test.tsx`

Expected: PASS。

## Task 6: 全量验证和浏览器检查

**Files:**
- Modify: no additional source files unless verification finds issues.

- [ ] **Step 1: 前端测试**

Run: `cd frontend && npm test`

Expected: PASS。

- [ ] **Step 2: 前端构建**

Run: `cd frontend && npm run build`

Expected: PASS。

- [ ] **Step 3: 浏览器检查**

打开 `http://localhost:5174/practice/...`、`/wrong-questions`、`/bookmarked-questions`，在窄屏视口检查：

- 不出现横向滚动。
- 底部工具栏固定显示。
- 弹层目录或筛选弹层可打开和关闭。
- `Suivant` 不被底部工具栏遮挡。

如果本地服务未启动，先启动前端和后端再检查。
