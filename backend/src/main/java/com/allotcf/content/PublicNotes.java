package com.allotcf.content;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.util.HtmlUtils;

@Controller
public class PublicNotes {

  private final GrammarNotes notes;
  private final String base;

  public PublicNotes(
    GrammarNotes notes,
    @Value("${app.public-base-url:http://localhost:5173}") String base
  ) {
    this.notes = notes;
    this.base = base.replaceAll("/+$", "");
  }

  @ModelAttribute
  public void headers(HttpServletResponse response) {
    response.setHeader("Cache-Control", "no-store");
    response.setHeader(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"
    );
  }

  @GetMapping("/")
  public String home(Model model) {
    model.addAttribute("base", base);
    return "content/home";
  }

  @GetMapping("/grammar")
  public String list(
    Model model,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(required = false) Long topic
  ) {
    model.addAttribute("listing", notes.list(null, page, topic));
    model.addAttribute("topics", notes.topics());
    model.addAttribute("selectedTopic", topic);
    model.addAttribute("base", base);
    return "content/list";
  }

  @GetMapping("/grammar/{slug}")
  public String detail(Model model, @PathVariable String slug) {
    model.addAttribute("note", notes.published(slug));
    model.addAttribute("base", base);
    return "content/note";
  }

  @GetMapping(value = "/sitemap.xml", produces = "application/xml")
  @ResponseBody
  public String sitemap() {
    StringBuilder xml = new StringBuilder(
      "<?xml version=\"1.0\" encoding=\"UTF-8\"?><urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">"
    );
    for (String path : java.util.stream.Stream.concat(
      java.util.stream.Stream.of("/", "/grammar"),
      notes
        .publicSlugs()
        .stream()
        .map(slug -> "/grammar/" + slug)
    ).toList())
      xml
        .append("<url><loc>")
        .append(HtmlUtils.htmlEscape(base + path))
        .append("</loc></url>");
    return xml.append("</urlset>").toString();
  }
}
