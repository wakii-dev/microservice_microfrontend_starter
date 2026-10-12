package api

// fakes_test.go — fake store/resolver/tasks cho unit test handlers (không DB).

import (
	"context"
	"sync"

	"github.com/google/uuid"

	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/apperr"
	"github.com/wakii-dev/architecture-overview/services/go-svc/internal/model"
)

type fakeStore struct {
	mu     sync.Mutex
	events []model.Event
	// lỗi inject được
	insertErr error
	listErr   error
	recentErr error
	// eventsLenForRecent — override CountRecent24h (test stats không cần seed)
	eventsLenForRecent int
}

func (f *fakeStore) InsertEvent(_ context.Context, e *model.Event) error {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.insertErr != nil {
		return f.insertErr
	}
	f.events = append(f.events, *e)
	return nil
}

func (f *fakeStore) ListEvents(_ context.Context, limit, offset int) ([]model.Event, int, error) {
	f.mu.Lock()
	defer f.mu.Unlock()
	if f.listErr != nil {
		return nil, 0, f.listErr
	}
	total := len(f.events)
	// events giữ thứ tự insert; feed cần mới nhất trước — reverse slice
	out := make([]model.Event, 0, limit)
	for i := total - 1 - offset; i >= 0 && len(out) < limit; i-- {
		out = append(out, f.events[i])
	}
	return out, total, nil
}

func (f *fakeStore) CountRecent24h(context.Context) (int, error) {
	if f.recentErr != nil {
		return 0, f.recentErr
	}
	if f.eventsLenForRecent > 0 {
		return f.eventsLenForRecent, nil
	}
	return len(f.events), nil
}

type fakeTasks struct {
	titles map[uuid.UUID]string
	stats  model.TaskStats
	err    error // nếu non-nil → trả cho Stats/TaskTitle (unavail=true → ErrTasksUnavailable)
	unavail bool
	probeErr error
}

func (f *fakeTasks) TaskTitle(_ context.Context, id uuid.UUID) (string, error) {
	if f.unavail {
		return "", apperr.ErrTasksUnavailable
	}
	if f.err != nil {
		return "", f.err
	}
	return f.titles[id], nil
}

func (f *fakeTasks) Stats(context.Context) (model.TaskStats, error) {
	if f.unavail {
		return model.TaskStats{}, apperr.ErrTasksUnavailable
	}
	if f.err != nil {
		return model.TaskStats{}, f.err
	}
	return f.stats, nil
}

func (f *fakeTasks) Probe(context.Context) error {
	if f.unavail {
		return apperr.ErrTasksUnavailable
	}
	return f.probeErr
}

type fakeResolver struct {
	name string
}

func (f fakeResolver) UserName(context.Context, string, uuid.UUID) string { return f.name }

// mustUUID helper — parse uuid trong test, panic nếu sai literal.
func mustUUID(s string) uuid.UUID {
	return uuid.MustParse(s)
}
