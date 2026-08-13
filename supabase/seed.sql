-- Optional sample data, matching the prototype's sample library, so the app
-- has something to show immediately after schema.sql is run. Safe to skip
-- in a real deployment where you'll add your own books.

insert into books (title, author, color) values
  ('강아지똥', '권정생', '#C9845D'),
  ('무지개 물고기', '마르쿠스 피스터', '#89977A'),
  ('아낌없이 주는 나무', '쉘 실버스타인', '#8196A8'),
  ('100만 번 산 고양이', '사노 요코', '#B9A184'),
  ('곰 사냥을 떠나자', '마이클 로젠', '#A9825F'),
  ('치과 의사 드소토 선생님', '윌리엄 스타이그', '#9A8A6F'),
  ('프레드릭', '레오 리오니', '#C9845D'),
  ('이슬이의 첫 심부름', '츠츠이 요리코', '#89977A'),
  ('지각대장 존', '존 버닝햄', '#8196A8'),
  ('손 큰 할머니의 만두 만들기', '채인선', '#B9A184');

insert into weekly_curations (week_start, week_end, title) values
  ('2026-08-10', '2026-08-16', '이번 주 책');

insert into weekly_curation_books (curation_id, book_id, "order")
select c.id, b.id, row_number() over (order by b.id) - 1
from weekly_curations c, books b
where c.week_start = '2026-08-10' and b.id <= 5;

insert into reading_sessions (book_id, read_date, read_number) values
  (1, '2026-08-08', 1),
  (1, '2026-08-11', 2),
  (2, '2026-08-09', 1),
  (3, '2026-08-10', 1),
  (5, '2026-08-09', 1),
  (6, '2026-05-14', 1),
  (7, '2026-04-02', 1),
  (8, '2026-03-21', 1),
  (9, '2026-06-30', 1),
  (10, '2026-02-11', 1);

insert into records (book_id, reading_session_id, type, content, created_at)
select 1, id, 'drawing', '강아지똥이 노란 민들레 옆에 앉아있는 그림', '2026-08-08'
from reading_sessions where book_id = 1 and read_number = 1;

insert into records (book_id, reading_session_id, type, content, created_at)
select 1, id, 'quote', '쓸모없는 것도 도움이 될 수 있어.', '2026-08-08'
from reading_sessions where book_id = 1 and read_number = 1;

insert into records (book_id, reading_session_id, type, content, created_at)
select 1, id, 'action', '집 앞에서 민들레를 찾아 관찰해봤어요.', '2026-08-08'
from reading_sessions where book_id = 1 and read_number = 1;

insert into records (book_id, reading_session_id, type, content, created_at)
select 1, id, 'thought', '다시 읽으니까 강아지똥이 안 불쌍하고 멋있어 보였어요.', '2026-08-11'
from reading_sessions where book_id = 1 and read_number = 2;

insert into records (book_id, reading_session_id, type, content, created_at)
select 2, id, 'quote', '반짝이는 비늘을 나눠주는 게 처음엔 좀 아까웠을 것 같아요.', '2026-08-09'
from reading_sessions where book_id = 2;

insert into records (book_id, reading_session_id, type, content, created_at)
select 3, id, 'diary', '나무가 다 주고 그루터기만 남았는데도 소년이 앉을 수 있어서 다행이라고 생각했다.', '2026-08-10'
from reading_sessions where book_id = 3;
