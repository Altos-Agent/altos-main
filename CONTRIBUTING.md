# Contributing to Altos

Thank you for your interest in contributing to Altos! This document outlines how you can help.

## Code of Conduct

By participating, you agree to uphold our community standards:
- Be respectful and inclusive
- Focus on constructive feedback
- Show empathy towards others
- Keep discussions technical and productive

## How to Contribute

### Reporting Bugs

1. **Search first** - Check if someone else reported the issue
2. **Use issue templates** - Fill out the bug report template
3. **Include details**:
   - OS and version
   - Node.js version
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages and stack traces

### Suggesting Features

1. **Check the roadmap** - See if it's already planned
2. **Open a discussion** - Propose your idea before coding
3. **Describe the use case** - Why would this be useful?
4. **Consider scope** - Keep feature requests focused

### Pull Requests

#### Before You Start

- Fork the repository
- Create a feature branch: `git checkout -b feature/my-feature`
- Make sure tests pass

#### PR Guidelines

1. **Keep PRs focused** - One feature or fix per PR
2. **Write clear titles**: `feat: add Telegram webhook support`
3. **Describe changes**: Explain what and why, not just what
4. **Include tests** - Add tests for new functionality
5. **Update docs** - docs and examples if needed

#### PR Title Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, style, refactor, test, chore
Scope: cli, web, connector, etc.
```

Examples:
- `feat(cli): add agent memory commands`
- `fix(web): correct provider status display`
- `docs(connector): add Telegram setup guide`

#### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How was this tested?

## Checklist
- [ ] Code follows conventions
- [ ] Tests added/updated
- [ ] Docs updated
- [ ] No new warnings
```

## Development Process

### 1. Fork and Clone

```bash
git clone https://github.com/YOUR_USERNAME/altos-agent.git
cd altos-agent
git remote add upstream https://github.com/altos-ai/altos-agent.git
```

### 2. Create a Branch

```bash
git checkout -b type/short-description
# Examples:
git checkout -b feat/telegram-webhook
git checkout -b fix/provider-status
git checkout -b docs/update-readme
```

### 3. Make Your Changes

```bash
# Make changes
git add .
git commit -m "type(scope): description"

# Push to your fork
git push origin type/short-description
```

### 4. Open a Pull Request

1. Go to the original repository
2. Click "New Pull Request"
3. Select your branch
4. Fill out the PR template

## Types of Contributions

### Good First Issues

Look for issues labeled:
- `good first issue`
- `help wanted`
- `beginner`

### Areas Where Help is Needed

- Connector implementations (Telegram, Discord, GitHub, etc.)
- Automation actions and triggers
- Documentation improvements
- Test coverage
- Performance optimizations

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(cli): add agent create command
fix(web): resolve dashboard rendering issue  
docs: update API documentation
style(ui): adjust button padding
refactor(provider): simplify API client
test(automation): add workflow tests
chore(deps): update dependencies
```

## Questions?

- **GitHub Discussions**: For questions about the project
- **Issues**: For bug reports and feature requests
- **Discord**: For real-time chat (link in README)

## Recognition

Contributors will be:
- Listed in our CONTRIBUTORS file
- Mentioned in release notes
- Given credit in documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
