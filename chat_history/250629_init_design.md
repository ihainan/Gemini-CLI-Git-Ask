- 2025/06/29 16:00:00 

---

## Service

我想基于 Gemini CLI 来打造一个 Git/GitHub Repo 代码解读/问答的服务，对外提供 API 能实现基于某个 Git/GitHub Repo 实现基于 Code Base 的问题回答。

基本原理如下：

- 我们假设服务运行的机器上已经安装好了 Gemini CLI，而 Gemini CLI 提供了非交互模式，可以以类似如下的方式，调用 Gemini API，来回答用户的问题。

```yaml
# ihainan @ debian-dev in ~/extend/projects/Research/MCP-Zero on git:master o .venv [15:02:47]
$ echo "项目让 LLM 生成 tool_assistant，具体使用了什么提示词" | gemini

<下面是自然语言的回答>
```

- 此外 Gemini CLI 支持如下配置参数：

```yaml
   * `--command`: 指定要执行的命令。
   * `--prompt`: 提供附加的提示信息。
   * `--model`: 指定要使用的模型 (例如, 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro')。
   * `--temperature`: 控制生成内容的随机性，数值越高越随机。
   * `--top-p`: 控制生成内容的多样性。
   * `--top-k`: 限制下一个词的选择范围。
   * `--api-endpoint`: 指定 API 的接入点。
   * `--tools-path`: 指定工具代码的路径。
   * `--tool-config`: 提供工具的 JSON 配置。
   * `--cache-ttl`: 设置 token 缓存的有效时间 (Time-To-Live)。
   * `--no-cache`: 禁用 token 缓存。
   * `--max-output-tokens`: 限制输出的最大 token 数量。
   * `--project`: 指定您的 Google Cloud Project ID。
   * `--location`: 指定您的 Google Cloud Location。
```

- 我希望我们的服务能够提供一个 API，输入参数包含如下：
    - Git/GitHub Repo 地址
    - 用户关于这个 Repo 的问题
    - 可选的 branch 参数
    - 可选的超时参数
- 这个 API 被调用后，需要在本地做如下事情
    - 将 Git/GitHub Repo 转换为我们最终要 Clone 的地址和分支，如果 API 没有指定分支，则使用默认分支。最后我们要给 Git-Repo + Branch 确定一个唯一的目录名。
    - 在一个本地目录下面，检查我们要获取的 Git Repo + Branch 对应的目录是否已经存在
        - 如果已经存在，则检查分支上次更新的时间，看是否超过了预定的过期时间，是的话需要最小化更新该分支。
        - 如果不存在，在需要最小化拉取代码到本地。
        - 不管是哪种情况，同一个目录的更新需要存在锁机制，当一个线程/请求在更新一个目录时候，另一个想要读取相同目录的线程/请求必须要等待。
    - 上述操作完成之后，非交互模式执行 Gemini CLI，返回结果或者错误信息。
- 一些额外需要考虑的点
    - 我们需要一套机制，定期清理过长时间没有被访问的 Repo。
    - 我们需要给这个服务提供一个配置文件 config.yaml，里面至少要包含如下内容
        - 我们调用 Gemini CLI 的时候，提供的提示词
        - 可选的温度、Top-P、Top-K、模型选择配置
        - 默认的 API 超时配置
        - 已有 Repo 经过多长时间就应该被更新
        - Repo 过期天数定义（超过天数就会被清理）
        - 假如用户提供的是类似于 `https://github.com/xfey/MCP-Zero` 这样的地址，我默认应该使用 HTTPS 还是 SSH。
            - 暂时不需要考虑认证配置的事情，后续我们再实现，假设访问的都是公共可访问的 Repo。
        - 其他你觉得有意义的配置项
    - 我们后期要把这个服务进行容器化，暂时不要实现，但是实现上面功能过程中，不要出现跟容器化冲突的实习。
```

---


2025/06/29 16:49:00

---

让我们基于 @design.md ，先构建基础开发环境，包括：

1. 在根目录（不是 ./service 目录）初始化 git 仓库，构建 .gitignore，并把我们用于参考用途的 @/gemini-cli （Gemini-CLI 的原始源码）排除。
2. 在 service 目录初始化 NodeJS 的开发环境。
3. 在 service 目录下初始化 config.yaml.example，并复制一份 config.yaml。

---