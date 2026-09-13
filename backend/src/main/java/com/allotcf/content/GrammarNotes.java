package com.allotcf.content;

import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class GrammarNotes {

  public record Draft(
    String slug,
    String title,
    String summary,
    String body,
    String level,
    List<Long> topics,
    long expectedVersion
  ) {}

  public record Action(long expectedVersion, long revisionId) {}

  public record Topic(long id, String slug, String name) {}

  public record Note(
    long id,
    String slug,
    String visibility,
    long version,
    long revisionId,
    Long publishedRevisionId,
    String title,
    String summary,
    String body,
    String level,
    List<Long> topics,
    String html
  ) {}

  public record Card(
    long id,
    String slug,
    String visibility,
    String title,
    String summary,
    String level
  ) {}

  public record Page(List<Card> items, int page, boolean hasMore) {}

  private final JdbcTemplate jdbc;
  private final NoteMarkdown markdown;

  public GrammarNotes(JdbcTemplate jdbc, NoteMarkdown markdown) {
    this.jdbc = jdbc;
    this.markdown = markdown;
  }

  public void requireAuthor(long userId) {
    if (
      jdbc.queryForObject(
        "SELECT COUNT(*) FROM users WHERE id=? AND role='AUTHOR'",
        Integer.class,
        userId
      ) != 1
    ) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
  }

  public List<Topic> topics() {
    return jdbc.query(
      "SELECT id,slug,name FROM grammar_topic ORDER BY id",
      (r, n) -> new Topic(r.getLong(1), r.getString(2), r.getString(3))
    );
  }

  private Map<String, Object> owned(long id, long userId, boolean lock) {
    requireAuthor(userId);
    var rows = jdbc.queryForList(
      "SELECT * FROM grammar_note WHERE id=? AND author_id=?" +
        (lock ? " FOR UPDATE" : ""),
      id,
      userId
    );
    if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return rows.get(0);
  }

  private long number(Map<String, Object> row, String key) {
    return ((Number) row.get(key)).longValue();
  }

  private void version(Map<String, Object> row, long expected) {
    if (
      number(row, "lock_version") != expected
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "笔记已更新，请重新加载后再编辑"
    );
  }

  private void validate(Draft draft) {
    if (
      draft == null ||
      draft.expectedVersion() < 0 ||
      draft.slug() == null ||
      !draft.slug().matches("[a-z0-9]+(?:-[a-z0-9]+)*") ||
      draft.slug().length() > 120 ||
      draft.title() == null ||
      draft.title().isBlank() ||
      draft.title().length() > 200 ||
      draft.summary() == null ||
      draft.summary().length() > 400 ||
      draft.body() == null ||
      draft.body().isBlank() ||
      draft.body().length() > 100000 ||
      draft.level() == null ||
      !Set.of("", "A1", "A2", "B1", "B2", "C1", "C2").contains(draft.level()) ||
      draft.topics() == null ||
      draft.topics().size() > 5 ||
      draft.topics().stream().anyMatch(java.util.Objects::isNull)
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "请检查标题、正文、地址及分类，正文最多十万字"
    );
    Set<Long> allowed = new java.util.HashSet<>(
      topics().stream().map(Topic::id).toList()
    );
    if (
      !allowed.containsAll(draft.topics()) ||
      new java.util.HashSet<>(draft.topics()).size() != draft.topics().size()
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "主题无效或重复"
    );
  }

  private long insert(String sql, Object... values) {
    var key = new GeneratedKeyHolder();
    jdbc.update(connection -> {
      var statement = connection.prepareStatement(
        sql,
        Statement.RETURN_GENERATED_KEYS
      );
      for (int i = 0; i < values.length; i++) statement.setObject(
        i + 1,
        values[i]
      );
      return statement;
    }, key);
    return key.getKey().longValue();
  }

  // Revisions are append-only. Publishing moves a pointer, never edits a revision.
  private void revision(long id, Draft draft, long revisionNo) {
    long revisionId = insert(
      "INSERT INTO grammar_note_revision(note_id,revision_no,title,summary,body_markdown,cefr_level) VALUES(?,?,?,?,?,?)",
      id,
      revisionNo,
      draft.title().strip(),
      draft.summary(),
      draft.body(),
      draft.level()
    );
    for (Long topic : draft.topics())
      jdbc.update(
        "INSERT INTO grammar_note_revision_topic(revision_id,topic_id) VALUES(?,?)",
        revisionId,
        topic
      );
    jdbc.update(
      "UPDATE grammar_note SET slug=?,draft_revision_id=?,lock_version=lock_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      draft.slug(),
      revisionId,
      id
    );
  }

  @Transactional
  public Note create(long userId, Draft draft) {
    requireAuthor(userId);
    validate(draft);
    long id = insert(
      "INSERT INTO grammar_note(author_id,slug) VALUES(?,?)",
      userId,
      draft.slug()
    );
    revision(id, draft, 1);
    return editor(id, userId);
  }

  @Transactional
  public Note save(long id, long userId, Draft draft) {
    // Serialize mutations and compare the version while holding the row lock.
    var row = owned(id, userId, true);
    validate(draft);
    version(row, draft.expectedVersion());
    if (
      "ARCHIVED".equals(row.get("visibility"))
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "归档笔记不能编辑"
    );
    if (
      row.get("published_at") != null && !row.get("slug").equals(draft.slug())
    ) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST,
      "发布后的地址保持固定"
    );
    revision(id, draft, number(row, "lock_version") + 1);
    return editor(id, userId);
  }

  @Transactional(readOnly = true)
  public Note editor(long id, long userId) {
    var row = owned(id, userId, false);
    return read(row, number(row, "draft_revision_id"));
  }

  @Transactional(readOnly = true)
  public Note preview(long id, long userId, Action action) {
    var row = owned(id, userId, false);
    version(row, action.expectedVersion());
    if (
      number(row, "draft_revision_id") != action.revisionId()
    ) throw new ResponseStatusException(HttpStatus.CONFLICT, "草稿版本已变化");
    return read(row, action.revisionId());
  }

  @Transactional
  public Note publish(long id, long userId, Action action) {
    var row = owned(id, userId, true);
    version(row, action.expectedVersion());
    if (
      "ARCHIVED".equals(row.get("visibility")) ||
      number(row, "draft_revision_id") != action.revisionId()
    ) throw new ResponseStatusException(
      HttpStatus.CONFLICT,
      "草稿版本已变化或笔记已归档"
    );
    jdbc.update(
      "UPDATE grammar_note SET visibility='PUBLIC',published_revision_id=draft_revision_id,published_at=COALESCE(published_at,CURRENT_TIMESTAMP),lock_version=lock_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      id
    );
    return editor(id, userId);
  }

  @Transactional
  public Note hide(long id, long userId, long expected, boolean archive) {
    var row = owned(id, userId, true);
    version(row, expected);
    jdbc.update(
      "UPDATE grammar_note SET visibility=?,lock_version=lock_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?",
      archive ? "ARCHIVED" : "PRIVATE",
      id
    );
    return editor(id, userId);
  }

  private Note read(Map<String, Object> row, long revision) {
    var content = jdbc.queryForMap(
      "SELECT * FROM grammar_note_revision WHERE id=? AND note_id=?",
      revision,
      number(row, "id")
    );
    String body = (String) content.get("body_markdown");
    return new Note(
      number(row, "id"),
      (String) row.get("slug"),
      (String) row.get("visibility"),
      number(row, "lock_version"),
      revision,
      row.get("published_revision_id") == null
        ? null
        : number(row, "published_revision_id"),
      (String) content.get("title"),
      (String) content.get("summary"),
      body,
      (String) content.get("cefr_level"),
      jdbc.queryForList(
        "SELECT topic_id FROM grammar_note_revision_topic WHERE revision_id=? ORDER BY topic_id",
        Long.class,
        revision
      ),
      markdown.render(body)
    );
  }

  @Transactional(readOnly = true)
  public Note published(String slug) {
    var rows = jdbc.queryForList(
      "SELECT * FROM grammar_note WHERE slug=? AND visibility='PUBLIC' AND published_revision_id IS NOT NULL",
      slug
    );
    if (rows.isEmpty()) throw new ResponseStatusException(HttpStatus.NOT_FOUND);
    return read(rows.get(0), number(rows.get(0), "published_revision_id"));
  }

  @Transactional(readOnly = true)
  public Page list(Long authorId, int page, Long topicId) {
    if (page < 0 || page > 10000) throw new ResponseStatusException(
      HttpStatus.BAD_REQUEST
    );
    if (authorId != null) requireAuthor(authorId);
    String pointer =
      authorId == null ? "published_revision_id" : "draft_revision_id";
    String filter =
      authorId == null ? "n.visibility='PUBLIC'" : "n.author_id=?";
    var parameters = new java.util.ArrayList<Object>();
    if (authorId != null) parameters.add(authorId);
    if (topicId != null) {
      filter +=
        " AND EXISTS (SELECT 1 FROM grammar_note_revision_topic t WHERE t.revision_id=r.id AND t.topic_id=?)";
      parameters.add(topicId);
    }
    parameters.add(page * 20);
    var cards = jdbc.query(
      "SELECT n.id,n.slug,n.visibility,r.title,r.summary,r.cefr_level FROM grammar_note n JOIN grammar_note_revision r ON r.id=n." +
        pointer +
        " WHERE " +
        filter +
        " ORDER BY n.id DESC LIMIT 21 OFFSET ?",
      (r, i) ->
        new Card(
          r.getLong(1),
          r.getString(2),
          r.getString(3),
          r.getString(4),
          r.getString(5),
          r.getString(6)
        ),
      parameters.toArray()
    );
    return new Page(cards.stream().limit(20).toList(), page, cards.size() > 20);
  }

  public List<String> publicSlugs() {
    return jdbc.queryForList(
      "SELECT slug FROM grammar_note WHERE visibility='PUBLIC' AND published_revision_id IS NOT NULL ORDER BY id",
      String.class
    );
  }
}
