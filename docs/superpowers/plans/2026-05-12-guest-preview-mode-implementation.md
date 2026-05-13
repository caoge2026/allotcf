# Guest Preview Mode Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 增加访客预览模式，让用户无需注册即可浏览所有功能，并限制 10 次关键动作。

**Architecture:** 后端把访客作为真实 `User` 处理，新增访客类型、关键动作计数与限制检查，现有 JWT、练习、错题、收藏逻辑继续复用。前端在登录页增加访客入口，用户状态保存访客字段，并在关键动作触发 `GUEST_LIMIT_REACHED` 时显示中文引导弹层。

**Tech Stack:** Java 17、Spring Boot、Spring Security、Spring Data JPA、MySQL 5.7、React、TypeScript、Zustand、Vitest、Testing Library。

---

## 文件结构

- Modify: `backend/src/main/java/com/allotcf/entity/User.java`
  - 增加 `userType`、`guestActionCount`、`guestActionLimit`、`guestExpiresAt` 字段。
- Modify: `backend/src/main/java/com/allotcf/dto/auth/AuthResponse.java`
  - 返回访客状态和剩余次数。
- Modify: `backend/src/main/java/com/allotcf/service/AuthService.java`
  - 增加 `loginAsGuest()`。
- Modify: `backend/src/main/java/com/allotcf/controller/AuthController.java`
  - 增加 `POST /api/auth/guest`。
- Create: `backend/src/main/java/com/allotcf/dto/common/ErrorResponse.java`
  - 统一返回 `code` 和 `message`。
- Create: `backend/src/main/java/com/allotcf/service/GuestActionService.java`
  - 集中判断并消耗访客关键动作次数。
- Create: `backend/src/main/java/com/allotcf/exception/GuestLimitReachedException.java`
  - 表示访客次数已用完。
- Modify: `backend/src/main/java/com/allotcf/controller/PracticeController.java`
  - 对提交套题、保存进度、重新练习等关键动作消耗次数。
- Modify: `backend/src/main/java/com/allotcf/controller/WrongQuestionController.java`
  - 对错题提交、收藏、取消收藏消耗次数。
- Modify: `backend/src/test/java/com/allotcf/controller/AuthControllerTest.java`
  - 覆盖访客登录。
- Create: `backend/src/test/java/com/allotcf/service/GuestActionServiceTest.java`
  - 覆盖访客计数和限制。
- Create: `scripts/deploy/2026-05-12-guest-preview-mode.sql`
  - 增加访客相关字段。
- Modify: `frontend/src/services/authService.ts`
  - 增加 `loginAsGuest()` 和访客字段类型。
- Modify: `frontend/src/stores/userStore.ts`
  - 保存 `userType`、`guestActionCount`、`guestActionLimit`。
- Modify: `frontend/src/pages/LoginPage.tsx`
  - 增加 `访客预览` 按钮。
- Modify: `frontend/src/services/http.ts`
  - 识别 `GUEST_LIMIT_REACHED`，抛出可被页面捕获的错误。
- Create: `frontend/src/components/GuestLimitDialog.tsx`
  - 达到限制后的中文弹层。
- Modify: `frontend/src/components/StudyTabs.tsx`
  - 显示 `访客预览` 和剩余关键动作次数。
- Test: `frontend/src/__tests__/pages/LoginPage.test.tsx`
  - 覆盖访客登录入口。
- Test: `frontend/src/__tests__/stores/userStore.test.ts`
  - 覆盖访客字段持久化。

## Task 1: 后端访客身份和登录

- [ ] 写 `AuthControllerTest`：`POST /api/auth/guest` 返回 token、`userType=GUEST`、限制 10。
- [ ] 运行测试确认失败。
- [ ] 扩展 `User` 和 `AuthResponse`。
- [ ] 实现 `AuthService.loginAsGuest()` 和 `AuthController.guest()`。
- [ ] 运行后端认证测试确认通过。

## Task 2: 后端访客关键动作限制

- [ ] 写 `GuestActionServiceTest`：正式用户不消耗次数，访客成功消耗次数，达到 10 次后抛出 `GuestLimitReachedException`。
- [ ] 运行测试确认失败。
- [ ] 实现 `GuestActionService` 和异常类。
- [ ] 在关键动作 controller 中调用 `consumeIfGuest(user)`。
- [ ] 运行相关后端测试确认通过。

## Task 3: 数据库迁移脚本

- [ ] 新增 `scripts/deploy/2026-05-12-guest-preview-mode.sql`。
- [ ] 字段使用 MySQL 5.7 兼容写法。
- [ ] 脚本只新增列，不破坏已有用户。

## Task 4: 前端访客入口和用户状态

- [ ] 写 `LoginPage.test.tsx`：点击 `访客预览` 调用 `loginAsGuest`，保存用户并进入题库。
- [ ] 写 `userStore.test.ts`：访客字段可持久化和登出清除。
- [ ] 运行测试确认失败。
- [ ] 扩展 `authService`、`userStore`、`LoginPage`。
- [ ] 运行前端测试确认通过。

## Task 5: 前端访客限制提示

- [ ] 新增 `GuestLimitDialog`。
- [ ] 在 HTTP 层保留 `GUEST_LIMIT_REACHED` 错误，不当作普通 403 强制登出。
- [ ] 在全局或关键页面显示中文弹层。
- [ ] 运行前端测试和构建。

## 验证

- 后端：`mvn test -Dtest=AuthControllerTest,GuestActionServiceTest,PracticeServiceTest,WrongQuestionServiceTest`
- 前端：`npm test -- LoginPage.test.tsx userStore.test.ts --run`
- 构建：`npm run build`
