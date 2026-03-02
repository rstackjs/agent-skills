# Code Review Style Guide

## Skill and README Consistency

When a PR adds, removes, or renames a skill directory under `skills/`, check that `README.md` is also updated to reflect the change:

- Adding a new skill directory requires a corresponding new section in `README.md` with the skill name, install command (`npx skills add rstackjs/agent-skills --skill <name>`), and description.
- Removing a skill directory requires removing its section from `README.md`.
- Renaming a skill directory requires updating its section in `README.md`.
- The Table of Contents in `README.md` must stay in sync with the skill sections.

If `README.md` is not updated alongside skill directory changes, flag this as a **High** severity issue.
