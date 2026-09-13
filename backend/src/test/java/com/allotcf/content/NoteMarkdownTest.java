package com.allotcf.content;

import static org.assertj.core.api.Assertions.*;

import org.junit.jupiter.api.Test;

class NoteMarkdownTest {

  @Test
  void escapes_html_and_removes_unsafe_links_and_images() {
    String html = new NoteMarkdown().render(
      "## Bonjour\n\n<script>alert(1)</script>\n\n[x](javascript:alert) ![x](https://example.test/x) [source](https://example.test)"
    );
    assertThat(html)
      .contains("<h2>Bonjour</h2>", "https://example.test")
      .doesNotContain("<script>", "javascript:", "<img");
  }
}
