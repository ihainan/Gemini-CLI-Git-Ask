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