# Benchmark Report
## Per-run results
| Eval | Config | Passed | Total | Rate | Tokens | Duration (s) |
|------|--------|--------|-------|------|--------|-------------|
| create-new-docs | with_skill | 5 | 5 | 100% | 24242 | 172.9 |
| create-new-docs | without_skill | 4 | 5 | 80% | 29035 | 1338.4 |
| maintain-docs-for-pr | with_skill | 4 | 4 | 100% | 36784 | 244.0 |
| maintain-docs-for-pr | without_skill | 4 | 4 | 100% | 29510 | 325.1 |
| migrate-rspress-v1 | with_skill | 3 | 3 | 100% | 20598 | 159.8 |
| migrate-rspress-v1 | without_skill | 3 | 3 | 100% | 16933 | 103.7 |

## Summary

### with_skill
- Pass rate: 100.0% (std: 0.0%)
- Duration: 192.2s (std: 45.3s)
- Tokens: 27208 (std: 8491)

### without_skill
- Pass rate: 93.3% (std: 11.5%)
- Duration: 589.1s (std: 658.3s)
- Tokens: 25159 (std: 7128)
