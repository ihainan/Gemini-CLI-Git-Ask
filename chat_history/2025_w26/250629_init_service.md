# 20250629 Vibe Coding Prompts

## Design the service module

``` markdown
请完整阅读 @250629_init_design.md ，开始进行 service 的架构设计，保存在 @design.md 里面。

要求：

1. 输出文档使用英文。
2. 尽可能少使用 emoji。
```

## Initialize the service module

````markdown
帮我 git commit，格式要求是 Conventional Commits，一些参考例子：

```
feat(auth): support JSON Web Token authentication

Authenticate users via JWT tokens issued at login.
Add middleware to validate token and attach user info to req object
```

```
fix(cache): prevent cache stampede on high concurrency

Use promise-based locking on cache miss to ensure only one fetch.
```

以及

```
perf(db): add index on users.email for faster lookups

This index reduces query time from O(n) to O(log n) on login.
```

或者

```
docs: update README with docker & env setup instructions

Add examples for running with docker-compose and sample .env.
```
````

## Initialize testing framework for the service module

```` markdown
请为我的 Node.js + TypeScript + Express.js 项目初始化完整的测试框架。项目详情：

**技术栈要求：**
- Node.js 18+ with TypeScript
- Express.js API服务
- Jest 作为测试框架（设计文档中指定）
- 需要支持异步测试和API测试

**项目结构：**
- 源码在 `src/` 目录下
- 测试文件放在 `tests/` 目录下
- 使用 TypeScript，有 tsconfig.json 配置

**需要测试的组件：**
1. API路由：`/api/v1/ask` 端点
2. 服务层：repository-manager, gemini-executor, lock-manager, cleanup-service
3. 配置管理：config-manager
4. 工具类：logger 等
5. 错误处理和输入验证

**测试类型需求：**
- 单元测试（Unit tests）
- 集成测试（Integration tests）
- API端点测试（Endpoint tests）
- 错误场景测试（Error handling tests）

**具体要求：**
1. 配置 Jest + TypeScript 支持
2. 设置测试环境和配置文件
3. 创建测试工具和模拟（mocks）
4. 为每个主要组件创建测试文件模板
5. 配置 package.json 中的测试脚本
6. 支持覆盖率报告
7. 设置 CI/CD 友好的测试配置

请帮我：
1. 安装必要的测试依赖包
2. 配置 Jest 配置文件
3. 创建测试目录结构
4. 为主要组件创建测试文件骨架
5. 设置测试脚本和覆盖率报告

项目当前已有 package.json 和 tsconfig.json，请在现有配置基础上进行扩展。
```

service/tests/README.md was ganerated for this task.

```` markdown
🎯 我们已经完成的测试工作
1. 搭建了"测试工厂" 🏭
就像建了一个专门的工厂来检查产品质量：
Jest测试框架 - 就像质检部门的管理制度
TypeScript支持 - 确保代码类型安全，像质检标准
覆盖率报告 - 就像质检报告，告诉你哪些地方检查了，哪些没检查到
2. 制造了各种"测试工具" 🔧
我们创建了很多测试辅助工具，就像工厂里的各种检测设备：
MockDataFactory - 造假数据的机器，生成各种测试用的虚拟数据
TestAPIHelper - API测试助手，专门测试网络接口
MockFileSystem - 虚拟文件系统，模拟文件操作而不真的创建文件
各种Mock - 就像替身演员，模拟真实组件的行为
3. 已经完成质检的"产品" ✅
目前我们已经完整测试了2个核心组件：
ConfigManager（配置管理器） - 12个测试
就像餐厅的菜单管理员：
能正确读取菜单文件（YAML配置）
处理菜单不存在的情况
验证菜单内容是否合规
能快速查找特定菜品信息
Logger（日志记录器） - 6个测试
就像餐厅的监控摄像头：
能记录不同级别的事件（info、error等）
能同时输出到文件和控制台
处理记录失败的情况
4. 搭建了"模拟环境" 🎭
我们创建了很多"假"的外部环境，这样测试时不会影响真实系统：
假的Git操作 - 不会真的下载代码仓库
假的AI命令执行 - 不会真的调用Gemini AI
假的文件系统 - 不会真的创建/删除文件
📋 Service中还未实现的关键模块
通过查看项目结构，我发现这些重要的"车间"都是空的：
1. src/services/ 目录完全空白 🚧
这里应该是核心业务逻辑，但现在什么都没有：
RepositoryManager（仓库管理器） - 缺失
就像图书馆管理员：
负责下载GitHub代码仓库
管理本地代码缓存
决定什么时候更新代码
处理Git操作失败
GeminiExecutor（AI执行器） - 缺失
就像智能助手：
调用Gemini AI来分析代码
处理AI的回答
管理超时和错误
监控AI使用量
LockManager（锁管理器） - 缺失
就像门卫：
防止多个人同时修改同一个仓库
管理访问权限
处理死锁情况
CleanupService（清理服务） - 缺失
就像清洁工：
定期删除过期的代码仓库
清理无用的锁文件
管理磁盘空间
2. src/api/routes/ 和 src/api/middleware/ 空白 🚧
就像餐厅没有服务员和厨师：
没有真正的API接口处理代码
没有请求验证中间件
没有错误处理中间件
3. src/types/ 空白 🚧
没有TypeScript类型定义，就像没有产品规格说明书。
🔄 我们的测试需要后续修改的地方
1. 从"假"测试变成"真"测试
目前我们写的92个测试（除了18个完整的）都是"空架子"：
Apply
;
当真正的代码实现后，我们需要：
把这些空测试填充为真正的测试逻辑
调整Mock设置来匹配真实的实现
可能需要修改测试数据结构
2. API测试需要真实的服务器
目前的API测试是假的，当真实API实现后：
需要启动真实的Express服务器
测试真实的HTTP请求/响应
验证真实的数据库操作（如果有的话）
3. 集成测试需要真实的组件协作
现在各个组件都是独立mock的，当所有组件实现后：
需要测试组件之间的真实交互
验证完整的业务流程
测试真实的错误传播
🎯 总结
我们已经做的：
✅ 建好了完整的"测试工厂"（框架、工具、环境）
✅ 完整测试了2个已实现的组件（ConfigManager、Logger）
✅ 为未来的4个核心组件准备好了测试"模板"
还需要做的：
🚧 等开发者实现4个核心service组件
🚧 等API路由和中间件实现
🚧 把92个"空"测试填充为真实测试逻辑
🚧 调整和完善测试以匹配真实实现
就像我们已经建好了汽车工厂，制造了所有检测设备，但汽车的发动机、轮子、方向盘还没有造出来。一旦这些核心部件做好了，我们就能立即对它们进行全面的质量检测！
````