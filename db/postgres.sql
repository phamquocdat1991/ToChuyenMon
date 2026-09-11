BEGIN;
CREATE TABLE IF NOT EXISTS workspaces(id text PRIMARY KEY, owner text UNIQUE NOT NULL, name text NOT NULL, year text NOT NULL, school text NOT NULL);
CREATE TABLE IF NOT EXISTS memberships(id text PRIMARY KEY, workspace text NOT NULL REFERENCES workspaces(id),email text UNIQUE NOT NULL,role text NOT NULL,member text);
CREATE INDEX IF NOT EXISTS membership_workspace ON memberships(workspace);
CREATE TABLE IF NOT EXISTS records(id text PRIMARY KEY, workspace text NOT NULL REFERENCES workspaces(id),kind text NOT NULL,year text NOT NULL,title text NOT NULL,status text NOT NULL,due text NOT NULL DEFAULT '',assignee text REFERENCES records(id),parent text REFERENCES records(id),category text NOT NULL DEFAULT '',body text NOT NULL DEFAULT '',details text NOT NULL DEFAULT '{}',revision integer NOT NULL DEFAULT 1,updated text NOT NULL,actor text NOT NULL);
CREATE INDEX IF NOT EXISTS records_workspace_kind ON records(workspace,kind);
CREATE INDEX IF NOT EXISTS records_parent ON records(parent);
CREATE TABLE IF NOT EXISTS versions(id text PRIMARY KEY,record text NOT NULL REFERENCES records(id),revision integer NOT NULL,snapshot text NOT NULL,actor text NOT NULL,created text NOT NULL,note text NOT NULL,UNIQUE(record,revision));
CREATE TABLE IF NOT EXISTS files(id text PRIMARY KEY,workspace text NOT NULL REFERENCES workspaces(id),record text NOT NULL REFERENCES records(id),name text NOT NULL,mime text NOT NULL,size integer NOT NULL,created text NOT NULL);
CREATE INDEX IF NOT EXISTS files_record ON files(record);
-- No public Data API access: application routes enforce role and workspace checks.
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE records ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
COMMIT;
