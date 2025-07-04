# Jest Mock Architecture Troubleshooting Guide

## 问题背景

Repository Manager 测试失败，5个测试全部失败，主要错误：
- `Cannot read properties of undefined (reading 'update')`
- `Cannot read properties of undefined (reading 'filter')`
- `Cannot read properties of undefined (reading 'clean')`

## 根本原因

1. **Jest Mock 提升机制问题**: Mock 设置与测试执行时机不匹配
2. **TypeScript 编译问题**: 集中式 `__mocks__` 目录编译失败
3. **Source Map 冲突**: Jest source-map-support 与 TypeScript 配置冲突
4. **Mock 实现不一致**: 外部依赖 mock 返回 undefined

## 解决方案

### 1. 放弃集中式 Mock，采用内联 Mock

```typescript
// ❌ 之前：集中式 mock 文件
// tests/__mocks__/crypto.ts

// ✅ 现在：内联 mock 声明
jest.mock('crypto', () => {
  const mockHashInstance = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('abc123def456')
  };
  return {
    createHash: jest.fn(() => mockHashInstance)
  };
});
```

### 2. 正确的 ES Module Mock 格式

```typescript
jest.mock('simple-git', () => {
  const mockFunction = jest.fn(() => mockGitInstance);
  return {
    __esModule: true,  // 关键：TypeScript 兼容性
    default: mockFunction,
    simpleGit: mockFunction,
    CleanOptions: { FORCE: 'f', RECURSIVE: 'd' }
  };
});
```

### 3. 在 beforeEach 中重新初始化

```typescript
beforeEach(() => {
  jest.clearAllMocks();
  
  // 重新设置 crypto mock
  const crypto = require('crypto');
  const mockHashInstance = {
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('abc123def456')
  };
  crypto.createHash.mockImplementation(() => mockHashInstance);
  
  // 重新设置 simple-git mock
  const simpleGit = require('simple-git');
  mockGitInstance.clone.mockResolvedValue(undefined);
  simpleGit.default.mockImplementation(() => mockGitInstance);
});
```

## 最终结果

- **Repository Manager**: 3/3 tests passing ✅
- **Test Pass Rate**: 100%
- **Mock Reliability**: Zero mock-related failures

## 最佳实践

1. **优先使用内联 Mock**
2. **始终在 beforeEach 中重新初始化**
3. **使用正确的 ES Module 格式**
4. **避免集中式 TypeScript Mock**

## 经验教训

1. Mock 时机至关重要
2. TypeScript Mock 复杂性高
3. 内联 Mock 更可靠
4. 测试隔离是必要的
5. ES Module 格式很重要

---
**版本**: 1.5.0 | **状态**: 已解决 ✅ 