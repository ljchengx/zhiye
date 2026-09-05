# 一程一成长账户与探索数据模型

## 1. 当前模拟账户

当前 `/kids` 默认是游客状态。用户在 `/kids/login` 输入以下本机测试账号后，`KidsAuthProvider` 才会创建已登录会话：

| 账号 | 密码 |
| --- | --- |
| `orange` | `orange123` |

| 对象 | 固定 ID | 显示名称 |
| --- | --- | --- |
| 登录用户 | `usr_orange_001` | 橙子小朋友 |
| 儿童资料 | `kid_orange_001` | 橙子小朋友 |
| 本地会话 | `ses_local_orange_001` | 登录后创建的模拟会话 |

会话存储键为 `yicheng-kids:auth-session:v1`，只保存会话标识、用户 ID、当前儿童 ID、认证时间和过期时间，不保存测试密码。固定 ID 保证刷新和重新构建后仍关联同一儿童身份。正式接入认证系统时，只替换 Provider 的会话来源，不改变业务组件的数据归属规则。

## 2. 身份分层

### 登录用户 `KidsUser`

表示通过认证的账户主体，字段包括 `id`、`displayName`、`role` 和 `createdAt`。角色预留 `child` 与 `guardian`。

### 儿童资料 `KidsChildProfile`

表示互动探究数据真正归属的孩子，字段包括 `id`、`ownerUserId`、`displayName`、头像信息和创建时间。它是儿童身份资料，不是“学习档案”。

登录用户与儿童资料分开后，可以支持孩子本人登录、家长选择孩子，以及一个家长管理多个孩子。不同孩子的探索足迹必须相互隔离。

### 登录会话 `KidsSession`

会话包含 `userId` 和 `activeChildId`。需要持久化的互动业务读取 `activeChildId`，不使用昵称或浏览器作为数据归属依据。

账号只负责确认儿童身份。登录本身不会创建探索足迹，也不会改变数学、拼音打印工具的行为。

## 3. 产品数据边界

### 打印工具

`format: "printable"` 的数学和拼音模块是无状态内容生成器：

- 无需登录即可选择内容、生成练习纸并导出 PDF。
- 不写入探索足迹，不提供完成、推荐下一项或连续使用统计。
- 页面配置只服务于当前生成过程，刷新后允许恢复默认值。

### 互动探究与自由创作

只有 `format: "interactive"` 或 `format: "creative"` 的模块可以写入探索足迹。首个互动模块上线前，首页不展示空的足迹摘要或预告入口。

## 4. 探索足迹 v1

本地存储键为 `yicheng-kids:exploration-traces:v1`：

```ts
interface KidsExplorationTrace {
  childId: string;
  activityId: string;
  challengeId: string;
  status: "started" | "completed";
  attempts: number;
  updatedAt: string;
}

interface KidsExplorationV1 {
  version: 1;
  traces: readonly KidsExplorationTrace[];
}
```

唯一业务键为 `childId + activityId + challengeId`。同一挑战的重复尝试累加 `attempts`，完成状态不会被后续开始事件回退。该模型不包含打印工具专用字段，也不读取或迁移旧的进度键。

## 5. 正式后端映射

| 前端模型 | 建议后端资源 | 关键字段 |
| --- | --- | --- |
| `KidsUser` | `users` | `id`, `display_name`, `role`, `created_at` |
| `KidsChildProfile` | `child_profiles` | `id`, `owner_user_id`, `display_name`, `avatar`, `created_at` |
| `KidsSession` | 认证服务会话 | `user_id`, `active_child_id`, `expires_at` |
| `KidsExplorationTrace` | `exploration_traces` | `child_id`, `activity_id`, `challenge_id`, `status`, `attempts`, `updated_at` |

后端应为 `exploration_traces(child_id, activity_id, challenge_id)` 建立唯一约束，通过更新操作累加尝试次数并保护已完成状态。

## 6. 正式认证接入边界

- 用真实会话 Provider 替换当前 `KidsAuthProvider` 的本机会话读取和测试账号校验逻辑。
- 登录成功后返回当前用户及可访问的儿童资料列表。
- 切换儿童资料只改变 `activeChildId`，不得混合不同孩子的探索足迹。
- 将 `KidsExplorationRepository` 的本地实现替换为远端 API 实现，互动页面不直接调用认证 SDK 或数据库。
- 云端写入必须校验当前登录用户有权访问目标 `childId`。
- 账号退出后清除会话，不默认删除本机或云端探索足迹。
