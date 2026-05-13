# AllotCF 界面润色实施计划

> **面向执行代理：** 必须使用 `superpowers:subagent-driven-development`（如果可用子代理）或 `superpowers:executing-plans` 来执行本计划。各步骤使用复选框语法（`- [ ]`）跟踪进度。

**目标：** 将已经确认的偏绿色编辑感视觉系统，统一应用到 `登录`、`注册`、`题库列表`、`答题`、`结果` 这条完整流程中。

**架构：** 保持当前 React 路由结构和数据流不变，通过重写全局 CSS 设计令牌和页面级布局模式，建立统一视觉语言。本次重点放在样式、层级、间距和状态呈现，不改动 API 契约和核心交互行为。

**技术栈：** React 18、Vite、TypeScript、React Router v6、Zustand、CSS

---

## 文件结构

- 修改：`frontend/src/index.css`
  职责：定义全局偏绿色编辑感设计令牌、排版体系、页面背景，以及共享的输入框、按钮、卡片、面板等样式。
- 修改：`frontend/src/pages/LoginPage.tsx`
  职责：应用已确认的编辑感登录页布局和表单样式。
- 修改：`frontend/src/pages/RegisterPage.tsx`
  职责：与登录页保持同一视觉语言，同时保留当前注册行为。
- 修改：`frontend/src/pages/ExamSetListPage.tsx`
  职责：把题库列表呈现为经过编排的练习目录，并让页头和操作按钮进入新系统。
- 修改：`frontend/src/pages/PracticePage.tsx`
  职责：把阅读作答流程改造成更像考试内页的结构化体验，并强化选中状态层级。
- 修改：`frontend/src/pages/ResultPage.tsx`
  职责：将结果页呈现为一张带批注感的批改成绩页。
- 验证：`frontend/src/__tests__/pages/LoginPage.test.tsx`
- 验证：`frontend/src/__tests__/pages/ExamSetListPage.test.tsx`
- 验证：`frontend/src/__tests__/pages/ResultPage.test.tsx`
- 验证：`frontend/src/__tests__/stores/userStore.test.ts`
- 验证：`frontend/src/__tests__/stores/practiceStore.test.ts`

## 任务 1：建立共享的编辑感设计令牌

**文件：**
- 修改：`frontend/src/index.css`

- [ ] **步骤 1：检查当前全局 CSS，识别需要被新系统替换的脚手架阶段样式**

阅读：`frontend/src/index.css`

- [ ] **步骤 2：写入全局偏绿色编辑感设计令牌系统**

新增：
- 页面背景渐变与纸面底色
- 主文字、辅助文字、边框、强调色、成功色、错误色变量
- 标题与正文的统一排版节奏
- 共享的表单、按钮、卡片、面板、徽标、加载态样式
- 适配移动端的默认间距

- [ ] **步骤 3：运行生产构建，确认全局 CSS 正常编译**

运行：`cd frontend && npm run build`
预期：构建成功，没有 TypeScript 或 CSS 错误

## 任务 2：重做登录页和注册页视觉

**文件：**
- 修改：`frontend/src/pages/LoginPage.tsx`
- 修改：`frontend/src/pages/RegisterPage.tsx`
- 验证：`frontend/src/__tests__/pages/LoginPage.test.tsx`

- [ ] **步骤 1：先跑现有登录页测试，作为基线**

运行：`cd frontend && npm test -- LoginPage`
预期：`Tests 2 passed`

- [ ] **步骤 2：重构 LoginPage 标记结构，接入共享的编辑感布局类名**

应用：
- 页面外壳容器
- 编辑感标题和导语文案
- 样式化输入区
- 样式化主操作按钮
- 更克制的次级链接区域
- 与设计系统一致的行内错误态

- [ ] **步骤 3：重构 RegisterPage，保持同样的视觉结构**

沿用相同的页面壳层和表单语言，同时保留昵称字段与当前提交流程。

- [ ] **步骤 4：重新运行登录页测试**

运行：`cd frontend && npm test -- LoginPage`
预期：`Tests 2 passed`

## 任务 3：重做题库列表页视觉

**文件：**
- 修改：`frontend/src/pages/ExamSetListPage.tsx`
- 验证：`frontend/src/__tests__/pages/ExamSetListPage.test.tsx`

- [ ] **步骤 1：先跑现有题库页测试，作为基线**

运行：`cd frontend && npm test -- ExamSetListPage`
预期：`Tests 2 passed`

- [ ] **步骤 2：把页面头部改造成更像编辑目录的标题栏**

应用：
- 更大的页面标题
- 更克制的用户信息区域
- 更完整的空状态样式

- [ ] **步骤 3：把题库卡片改造成经过编排的练习条目**

应用：
- 更轻的纸面卡片质感
- 更强的标题层级
- 更安静的元信息
- 更有意图的“开始练习”按钮样式

- [ ] **步骤 4：重新运行题库页测试**

运行：`cd frontend && npm test -- ExamSetListPage`
预期：`Tests 2 passed`

## 任务 4：重做答题页视觉

**文件：**
- 修改：`frontend/src/pages/PracticePage.tsx`
- 验证：`frontend/src/__tests__/stores/practiceStore.test.ts`

- [ ] **步骤 1：先跑答题状态仓库测试，作为基线**

运行：`cd frontend && npm test -- practiceStore`
预期：`Tests 4 passed`

- [ ] **步骤 2：围绕“考试内页”隐喻重新设计答题布局**

应用：
- 更明确的进度条带
- 纸张质感的阅读材料区
- 层级更清晰的问题标题
- 更像纸面批注块的选项样式，而不是默认按钮
- 更清楚的选中态和禁用态

- [ ] **步骤 3：保持现有记答案和提交流程，只调整表现层**

除非布局稳定性必须要求，否则不要改动现有路由参数、store 调用方式和提交载荷结构。

- [ ] **步骤 4：重新运行答题状态仓库测试**

运行：`cd frontend && npm test -- practiceStore`
预期：`Tests 4 passed`

## 任务 5：重做结果页视觉

**文件：**
- 修改：`frontend/src/pages/ResultPage.tsx`
- 验证：`frontend/src/__tests__/pages/ResultPage.test.tsx`

- [ ] **步骤 1：先跑现有结果页测试，作为基线**

运行：`cd frontend && npm test -- ResultPage`
预期：`Tests 2 passed`

- [ ] **步骤 2：把分数摘要改造成更像批改总结的主视觉区**

应用：
- 更强的分数强调
- 更安静的正确率文本
- 纸面化结果面板样式

- [ ] **步骤 3：把逐题结果改造成带批注感的回顾条目**

应用：
- 更克制的正确态
- 更清晰但低饱和的错误态
- 一致的间距和边框节奏

- [ ] **步骤 4：重新运行结果页测试**

运行：`cd frontend && npm test -- ResultPage`
预期：`Tests 2 passed`

## 任务 6：端到端验证

**文件：**
- 修改：`frontend/src/index.css`
- 修改：`frontend/src/pages/LoginPage.tsx`
- 修改：`frontend/src/pages/RegisterPage.tsx`
- 修改：`frontend/src/pages/ExamSetListPage.tsx`
- 修改：`frontend/src/pages/PracticePage.tsx`
- 修改：`frontend/src/pages/ResultPage.tsx`

- [ ] **步骤 1：运行完整前端测试套件**

运行：`cd frontend && npm test`
预期：所有前端测试通过

- [ ] **步骤 2：运行生产构建**

运行：`cd frontend && npm run build`
预期：构建成功

- [ ] **步骤 3：刷新本地应用，手动验证四页完整流程**

验证：
- 登录页已经应用新的编辑感绿色系统
- 注册页与登录页使用同一语言体系
- 题库列表页像经过编排的练习目录
- 答题页像考试内页
- 结果页像批改后的成绩回顾页

- [ ] **步骤 4：提交代码**

```bash
git add frontend/src/index.css frontend/src/pages/LoginPage.tsx frontend/src/pages/RegisterPage.tsx frontend/src/pages/ExamSetListPage.tsx frontend/src/pages/PracticePage.tsx frontend/src/pages/ResultPage.tsx docs/superpowers/specs/2026-05-04-ui-polish-design.md docs/superpowers/plans/2026-05-04-ui-polish-implementation.md
git commit -m "feat: apply editorial green UI polish across practice flow"
```
