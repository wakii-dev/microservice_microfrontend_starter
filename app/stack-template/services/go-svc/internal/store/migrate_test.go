package store

import "testing"

func TestParseMigrationName(t *testing.T) {
	cases := []struct {
		name    string
		version int
		desc    string
		wantErr bool
	}{
		{"migrations/0001_create_events.sql", 1, "create_events", false},
		{"migrations/0012_add_column.sql", 12, "add_column", false},
		{"migrations/badname.sql", 0, "", true},
		{"migrations/0001_.sql", 0, "", true},
		{"migrations/xx_desc.sql", 0, "", true},
	}
	for _, tc := range cases {
		v, d, err := parseMigrationName(tc.name)
		if tc.wantErr {
			if err == nil {
				t.Errorf("%q: expected error", tc.name)
			}
			continue
		}
		if err != nil {
			t.Errorf("%q: unexpected err %v", tc.name, err)
			continue
		}
		if v != tc.version || d != tc.desc {
			t.Errorf("%q: got (%d,%q), want (%d,%q)", tc.name, v, d, tc.version, tc.desc)
		}
	}
}
