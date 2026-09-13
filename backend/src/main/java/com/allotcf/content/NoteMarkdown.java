package com.allotcf.content;

import org.commonmark.parser.Parser;
import org.commonmark.renderer.html.HtmlRenderer;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.stereotype.Component;

@Component
public class NoteMarkdown {

  public String render(String markdown) {
    String html = HtmlRenderer.builder()
      .escapeHtml(true)
      .sanitizeUrls(true)
      .build()
      .render(Parser.builder().build().parse(markdown));
    return Jsoup.clean(
      html,
      Safelist.basic().addTags("h1", "h2", "h3", "h4", "hr")
    );
  }
}
