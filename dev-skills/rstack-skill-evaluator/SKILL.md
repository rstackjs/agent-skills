---
name: rstack-skill-evaluator
description: Benchmark agent skills by generating evaluation cases, comparing skill-guided and baseline runs, and recording the resulting artifacts under skills-test/{skill-name}.
metadata:
  dependencies: ['skill-creator']
  internal: true
---

# rstack-skill-evaluator

Use skill-creator to test the skill. If the user hasn't mentioned, proactively ask the user which skill they want to test

If the user is not using claude code, they can switch to other agent CLI with one shot feature flag (you can use cli with --help to find one) and ask the user.

**Make sure to generate the test-related files in the "skills-test/{skill-name}" directory.**
