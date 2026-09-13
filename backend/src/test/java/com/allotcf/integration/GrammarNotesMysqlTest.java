package com.allotcf.integration;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.allotcf.config.JwtUtil;
import com.allotcf.content.GrammarNotes;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

@EnabledIfEnvironmentVariable(
  named = "ALLOTCF_TEST_MYSQL_URL",
  matches = "jdbc:mysql://127\\.0\\.0\\.1:13377/allotcf_test(?:\\?.*)?"
)
@SpringBootTest(
  properties = {
    "spring.datasource.url=${ALLOTCF_TEST_MYSQL_URL}",
    "spring.datasource.username=root",
    "spring.datasource.hikari.maximum-pool-size=3",
    "spring.datasource.hikari.minimum-idle=1",
    "spring.datasource.password=${ALLOTCF_TEST_MYSQL_PASSWORD:}",
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true",
    "jwt.secret=integration-test-secret-at-least-32-characters",
  }
)
@AutoConfigureMockMvc
class GrammarNotesMysqlTest {

  @Autowired
  GrammarNotes notes;

  @Autowired
  JdbcTemplate jdbc;

  @Autowired
  MockMvc mvc;

  @Autowired
  JwtUtil jwt;

  @BeforeEach
  void fixtures() {
    jdbc.update(
      "UPDATE grammar_note SET draft_revision_id=NULL,published_revision_id=NULL"
    );
    for (String t : List.of(
      "grammar_note_revision_topic",
      "grammar_note_revision",
      "grammar_note",
      "speaking_attempts",
      "user_exam_set_progress",
      "answer_record",
      "user_wrong_question",
      "user_question_bookmark",
      "practice_session",
      "question",
      "canonical_question",
      "exam_set",
      "users"
    ))
      jdbc.update("DELETE FROM " + t);
    jdbc.update(
      "INSERT INTO users(id,email,password,role) VALUES(901,'author@example.test','unused','AUTHOR'),(902,'other@example.test','unused','AUTHOR'),(903,'learner@example.test','unused','LEARNER')"
    );
  }

  GrammarNotes.Draft draft(String title, long version) {
    return new GrammarNotes.Draft(
      "passe-compose",
      title,
      "Résumé",
      "## Bonjour\n\nJ’ai étudié.",
      "A2",
      List.of(1L),
      version
    );
  }

  GrammarNotes.Action action(GrammarNotes.Note n) {
    return new GrammarNotes.Action(n.version(), n.revisionId());
  }

  String token(String email) {
    return "Bearer " + jwt.generateToken(email + "@example.test");
  }

  @Test
  void draft_is_private_and_authorship_is_enforced() throws Exception {
    var n = notes.create(901, draft("PRIVATE TITLE", 0));
    mvc
      .perform(get("/api/public/grammar-notes/passe-compose"))
      .andExpect(status().isNotFound());
    mvc.perform(get("/grammar/passe-compose")).andExpect(status().isNotFound());
    mvc
      .perform(get("/api/public/grammar-notes"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.items").isEmpty());
    mvc
      .perform(get("/api/manage/grammar-notes/" + n.id()))
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/manage/grammar-notes/" + n.id()).header(
          "Authorization",
          token("learner")
        )
      )
      .andExpect(status().isForbidden());
    mvc
      .perform(
        get("/api/manage/grammar-notes/" + n.id()).header(
          "Authorization",
          token("other")
        )
      )
      .andExpect(status().isNotFound());
    mvc
      .perform(
        get("/api/manage/grammar-notes/" + n.id()).header(
          "Authorization",
          token("author")
        )
      )
      .andExpect(status().isOk())
      .andExpect(header().string("Cache-Control", "private, no-store"));
    String oldToken = token("author");
    jdbc.update("UPDATE users SET role='LEARNER' WHERE id=901");
    mvc
      .perform(
        get("/api/manage/grammar-notes").header("Authorization", oldToken)
      )
      .andExpect(status().isForbidden());
  }

  @Test
  void public_revision_metadata_and_topics_do_not_change_until_publish()
    throws Exception {
    var n = notes.create(901, draft("PUBLIC TITLE", 0));
    n = notes.publish(n.id(), 901, action(n));
    var next = new GrammarNotes.Draft(
      n.slug(),
      "SECRET TITLE",
      "SECRET SUMMARY",
      "SECRET BODY",
      "B2",
      List.of(2L),
      n.version()
    );
    var edited = notes.save(n.id(), 901, next);
    assertThat(notes.published(n.slug()).title()).isEqualTo("PUBLIC TITLE");
    assertThat(notes.list(null, 0, 1L).items()).hasSize(1);
    assertThat(notes.list(null, 0, 2L).items()).isEmpty();
    mvc
      .perform(get("/grammar/passe-compose"))
      .andExpect(status().isOk())
      .andExpect(
        content().string(org.hamcrest.Matchers.containsString("PUBLIC TITLE"))
      )
      .andExpect(
        content().string(
          org.hamcrest.Matchers.not(
            org.hamcrest.Matchers.containsString("SECRET")
          )
        )
      );
    mvc
      .perform(get("/sitemap.xml"))
      .andExpect(status().isOk())
      .andExpect(
        content().string(
          org.hamcrest.Matchers.containsString("/grammar/passe-compose")
        )
      );
    assertThat(notes.preview(n.id(), 901, action(edited)).title()).isEqualTo(
      "SECRET TITLE"
    );
    notes.publish(n.id(), 901, action(edited));
    assertThat(notes.published(n.slug()).title()).isEqualTo("SECRET TITLE");
  }

  @Test
  void stale_edits_and_cross_note_revision_pointers_are_rejected() {
    var first = notes.create(901, draft("Initial", 0));
    notes.save(first.id(), 901, draft("Saved", first.version()));
    assertThatThrownBy(() ->
      notes.save(first.id(), 901, draft("Overwrite", first.version()))
    ).hasMessageContaining("409");
    assertThatThrownBy(() ->
      notes.publish(first.id(), 901, action(first))
    ).hasMessageContaining("409");
    assertThat(notes.editor(first.id(), 901).title()).isEqualTo("Saved");
    var other = notes.create(
      902,
      new GrammarNotes.Draft("other", "Other", "", "Body", "", List.of(), 0)
    );
    assertThatThrownBy(() ->
      jdbc.update(
        "UPDATE grammar_note SET published_revision_id=? WHERE id=?",
        other.revisionId(),
        first.id()
      )
    ).isInstanceOf(
      org.springframework.dao.DataIntegrityViolationException.class
    );
  }

  @Test
  void unpublish_archive_and_restore_control_public_visibility()
    throws Exception {
    var n = notes.create(901, draft("Title", 0));
    n = notes.publish(n.id(), 901, action(n));
    var hidden = notes.hide(n.id(), 901, n.version(), false);
    mvc.perform(get("/grammar/passe-compose")).andExpect(status().isNotFound());
    mvc
      .perform(get("/sitemap.xml"))
      .andExpect(
        content().string(
          org.hamcrest.Matchers.not(
            org.hamcrest.Matchers.containsString("/grammar/passe-compose")
          )
        )
      );
    assertThatThrownBy(() ->
      notes.save(
        hidden.id(),
        901,
        new GrammarNotes.Draft(
          "renamed",
          "Title",
          "",
          "Body",
          "",
          List.of(),
          hidden.version()
        )
      )
    ).hasMessageContaining("400");
    var archived = notes.hide(n.id(), 901, hidden.version(), true);
    assertThatThrownBy(() ->
      notes.publish(archived.id(), 901, action(archived))
    ).hasMessageContaining("409");
    var restored = notes.hide(n.id(), 901, archived.version(), false);
    notes.publish(n.id(), 901, action(restored));
    assertThat(notes.published(n.slug()).title()).isEqualTo("Title");
  }

  @Test
  void server_renders_home_list_empty_state_and_styles_without_login()
    throws Exception {
    mvc
      .perform(get("/"))
      .andExpect(status().isOk())
      .andExpect(
        content().string(org.hamcrest.Matchers.containsString("把法语学明白"))
      );
    mvc
      .perform(get("/grammar"))
      .andExpect(status().isOk())
      .andExpect(
        content().string(org.hamcrest.Matchers.containsString("还没有公开笔记"))
      );
    mvc.perform(get("/grammar?topic=")).andExpect(status().isOk());
    mvc.perform(get("/content-assets/notes.css")).andExpect(status().isOk());
    mvc.perform(get("/grammar?page=-1")).andExpect(status().isBadRequest());
  }

  @Test
  void api_rejects_duplicate_slugs_and_malformed_drafts() throws Exception {
    notes.create(901, draft("Initial", 0));
    var mapper = new com.fasterxml.jackson.databind.ObjectMapper();
    mvc
      .perform(
        post("/api/manage/grammar-notes")
          .header("Authorization", token("author"))
          .contentType("application/json")
          .content(mapper.writeValueAsString(draft("Again", 0)))
      )
      .andExpect(status().isConflict());
    mvc
      .perform(
        post("/api/manage/grammar-notes")
          .header("Authorization", token("author"))
          .contentType("application/json")
          .content("{\"slug\":\"bad\"}")
      )
      .andExpect(status().isBadRequest());
  }
}
