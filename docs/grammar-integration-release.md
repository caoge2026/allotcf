# 语法笔记整合候选版本

候选源码：本发布分支根目录。恢复证据基线 `.recovery/production/` 保持原样。

此次整合从 GitHub main `412e48fa73b82f0f46453163865b9d703d6c798b` 加线上源码恢复补丁出发，加入本地已完成的语法笔记模块。保留访客限额、看图说话、问询台、错题复习、收藏、练习进度与登录页功能选择方式。笔记管理登录后会返回原编辑页，作者权限被撤销时不会清除登录凭证。

## 数据库路线

候选版本使用独立、真实的迁移序列：

1. V1 根据 2026-09-13 线上 12 张表的 SHOW CREATE TABLE 重建，调整创建顺序使外键被引用表先创建，不含业务数据。
2. 对已有数据库，先逐项校验列、默认值、索引、外键、字符集等结构，再显式标记 V1。结构漂移时拒绝继续；禁止自动 baseline、clean、repair。
3. V2 仅新增 users.role（旧用户默认 LEARNER）及四张笔记/版本/主题表，不重写练习和复习数据。
4. 应用启动默认关闭自动迁移，保留 Hibernate validate。迁移通过候选目录中的 scripts/migrate_database.py 单独执行。

**不能使用工作区根目录旧的 V1/V2/V3 迁移序列部署此候选版本。** 旧序列基于较早的本地数据库，和线上实际结构不同；原先的练习快照、评分持久化和复习模块重构仍保留在根目录，未混入本次笔记发布。

MySQL 5.7.27 演练发现 Spring Boot 默认 Flyway 9.22.3 社区版拒绝该数据库。候选 POM 显式锁定 Flyway 10.20.1。官方说明 Flyway 10 起移除了旧数据库版本的许可证限制：https://documentation.red-gate.com/fd/supported-databases-and-versions-143754067.html 。版本变更将在实际 MySQL 5.7.27 上验证，不能只看编译通过。

## 隔离演练和验证

测试实例：官方 MySQL Community 5.7.27，独立 `/var/tmp/allotcf-rehearsal-20260913/data/`，回环端口 13379，SSH 隧道本机 13377。使用随机密码，三个数据库均为专用测试库。官方归档 MD5 `020b17fcbe79df8d59811f638d89df0e` 与官方 CDN 标识及实际下载一致。

演练脚本 `scripts/rehearse_notes.py` 强制校验端口、版本、数据目录及测试库名，只接受空测试库。使用合成访客、阅读、错题、收藏、进度、口语记录；比较迁移前后的每个旧字段，验证恢复副本、结构漂移拒绝及重复 migrate 安全性。

真实生产数据备份尚未执行。自动审批拒绝将全部生产业务数据导出为本机明文 SQL，要求用户明确同意具体数据和目的地。合成数据演练不等于真实备份恢复演练。

## 上线前剩余条件

- 用户授权受限目录中的真实生产备份，执行一致性备份及恢复核验。
- 核验并创建 `admin@allotcf.com` 对应网站作者账号，安全交付首次登录方式；邮箱本身仍需阿里云企业邮管理员登录。
- 维护窗口内停止写入，重新检查线上结构和发布产物，备份数据库及现有 JAR、静态资源、配置。
- 显式 baseline/migrate 后发布候选 JAR 和前端，使用 `deploy/nginx.production.conf`；保留已有域名和证书。
- 检查登录、访客、练习、口语、公开笔记、管理鉴权和网站地图。失败时恢复旧应用及配置；不要自动删除新增笔记表。MySQL DDL 不支持整体事务回滚，部分迁移失败需按备份和实际状态处理。

公开页面使用 `/`、`/grammar`、`/grammar/{slug}`，管理页面使用 `/manage/grammar`。Nginx 对笔记 CSS 使用 `^~ /content-assets/`，避免被原有静态文件缓存规则截获；公开笔记和管理 API 禁止缓存。

## 最终验证结果（2026-09-13）

- 前端 112 项测试通过，TypeScript 与 Vite 构建通过。
- 后端 36 项测试通过，其中 6 项为 MySQL 5.7.27 集成测试，无失败或跳过。
- 迁移结构守卫 2 项测试通过。
- 12 张旧表、13 条合成记录的全部旧字段保留；合成副本恢复完全一致，结构漂移被拒绝，重复迁移不重复执行。
- 候选 Nginx 配置在服务器上通过 nginx -t，未替换或重载现网配置。
- Flyway 10.20.1 在 MySQL 5.7.27 上完成显式 baseline、migrate、validate、再次 migrate。

归档：主工作区 `docs/recovery/grammar-integration-source.tar.gz`。文件校验：`docs/recovery/grammar-integration-manifest.json`。迁移报告：`docs/recovery/notes-migration-rehearsal.json`。归档仅包含源码、配置模板、测试与结构元数据，不含生产数据或凭证。

MySQL 5.7.27 是 Community 测试实例，线上是 5.7.27-log 托管实例；演练不涵盖服务商补丁和所有现有业务路径。Hibernate 仍给出 MySQL 5.7 非受支持方言版本提示，这是已有技术栈限制。本次保留现有 JPA 行为，笔记写入使用 JDBC；未在此次发布中升级数据库。

演练结束后已停止独立 MySQL 进程和本机隧道。线上 allotcf/nginx 均保持 active，JAR SHA-256 仍为 `16d1f9d7784117ac4505bf3508cb13d2708ea8a2e8afad4b76212673441e56a8`，与恢复审计时一致。临时演练文件保留在权限为 700 的专用目录中。
