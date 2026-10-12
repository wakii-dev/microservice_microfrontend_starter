// Package apperr — sentinel errors dùng chung giữa store ↔ api (không import cycle).
package apperr

import "errors"

// ErrTasksUnavailable — schema tasks chưa migrate (SF-2 song song) hoặc
// readonly permission bị revoke. Handlers map → 503 DEPENDENCY_DOWN
// (conventions/04); store trả error này từ các query schema tasks.
var ErrTasksUnavailable = errors.New("schema tasks unavailable (not migrated yet or readonly permission denied)")
