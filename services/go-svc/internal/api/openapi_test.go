package api

// openapi_test.go — sync-check: bản copy spec trong service phải KHỚP 1:1
// contracts/openapi/activity.yaml (nguồn sự thật). Skip khi contracts không có
// cạnh service (standalone copy-dir — SF-7 semantics).

import (
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

func TestOpenAPISpecCopySyncsWithContract(t *testing.T) {
	// from internal/api → repo root = ../../../
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot locate test file")
	}
	repoRoot := filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "..")
	contract := filepath.Join(repoRoot, "contracts", "openapi", "activity.yaml")

	if _, err := os.Stat(contract); os.IsNotExist(err) {
		t.Skip("contracts/openapi/activity.yaml không tồn tại cạnh service (standalone copy) — skip sync check")
	}

	want, err := os.ReadFile(contract)
	if err != nil {
		t.Fatalf("read contract spec: %v", err)
	}
	got, err := OpenAPISpec()
	if err != nil {
		t.Fatalf("read embedded spec copy: %v", err)
	}
	if string(got) != string(want) {
		t.Errorf("internal/api/openapi/activity.yaml LỆCH contracts/openapi/activity.yaml — copy lại bản contract (spec là nguồn sự thật duy nhất)")
	}
}
