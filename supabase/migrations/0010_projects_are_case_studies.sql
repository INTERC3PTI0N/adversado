-- Adversado platform — 0010: a project *is* its case study.
--
-- The admin had two collections — "Portfolio" (`projects`) and "Case studies"
-- (`case_studies`) — for what the site treats as one thing: a piece of work
-- shown in the /projects gallery, which opens onto its own write-up. Two
-- tables meant two places to enter the same client, and a case study with no
-- way to reach it from the gallery.
--
-- The narrative moves onto `projects`. `case_studies` is left in place rather
-- than dropped: it is empty, nothing reads it any more, and dropping a table
-- on the live database is the one step here that can't be taken back.

alter table projects
  add column if not exists challenge text,
  add column if not exists approach  text,
  add column if not exists result    text;

comment on column projects.challenge is 'Case study: what the client was up against.';
comment on column projects.approach  is 'Case study: what was done about it.';
comment on column projects.result    is 'Case study: what changed.';

comment on table case_studies is
  'Superseded by projects.challenge / approach / result (migration 0010). Unused.';
