# Git Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification for commit messages.

## Commit Message Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to our CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit
- **init**: Initial setup or bootstrap of components

### Scopes (Optional)

Common scopes for this project:
- **service**: Main service application
- **config**: Configuration management
- **api**: API endpoints and routes
- **auth**: Authentication and authorization
- **db**: Database related changes
- **docs**: Documentation updates
- **tests**: Test files and testing utilities

## Examples

### Feature Addition
```
feat(api): add repository analysis endpoint

Implement POST /api/v1/ask endpoint for Git repository analysis.
Support branch selection and timeout configuration.
```

### Bug Fix
```
fix(config): handle missing configuration file gracefully

Return default values when config.yaml is not found instead of crashing.
```

### Documentation
```
docs: add API documentation and usage examples

Include request/response schemas and curl examples for all endpoints.
```

### Performance Improvement
```
perf(git): implement shallow cloning for faster repository access

Reduce clone time by 60% using --depth=1 for repository operations.
```

### Breaking Changes
```
feat(api)!: change response format for consistency

BREAKING CHANGE: All API responses now use standardized format with 
status, data, and error fields.
```

## Branch Naming Convention

- **feature/**: New features (`feature/add-gemini-integration`)
- **fix/**: Bug fixes (`fix/config-validation-error`)
- **docs/**: Documentation updates (`docs/api-specifications`)
- **refactor/**: Code refactoring (`refactor/simplify-git-operations`)
- **test/**: Test additions (`test/add-integration-tests`)

## Commit Best Practices

1. **Keep commits small and focused**: One logical change per commit
2. **Write clear descriptions**: Use imperative mood ("add" not "added")
3. **Reference issues**: Include issue numbers when applicable (`fixes #123`)
4. **Separate subject from body**: Use blank line between subject and body
5. **Limit subject line**: Keep under 50 characters
6. **Explain the why**: Body should explain motivation, not just what changed

## Merge Strategy

- Use **squash and merge** for feature branches to maintain clean history
- Use **merge commits** for release branches to preserve branch history
- Avoid **fast-forward merges** to maintain branch context

## Pre-commit Checks

Before committing, ensure:
- [ ] Code compiles without errors (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Commit message follows conventional format

## Revert Policy

When reverting commits:
```
revert: feat(api): add repository analysis endpoint

This reverts commit 1234567.
Reason: Performance regression detected in production.
```

## Release Versioning

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (incompatible API changes)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

Releases are automatically generated based on commit types:
- `feat` → MINOR version bump
- `fix` → PATCH version bump
- `feat!` or `BREAKING CHANGE:` → MAJOR version bump 