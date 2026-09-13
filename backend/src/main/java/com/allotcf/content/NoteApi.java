package com.allotcf.content;

import com.allotcf.entity.User;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class NoteApi {

  private final GrammarNotes notes;

  public NoteApi(GrammarNotes notes) {
    this.notes = notes;
  }

  @ModelAttribute
  public void headers(HttpServletResponse response) {
    response.setHeader("Cache-Control", "private, no-store");
    response.setHeader("X-Robots-Tag", "noindex");
  }

  @GetMapping("/me")
  public Map<String, Object> me(@AuthenticationPrincipal User user) {
    return Map.of("id", user.getId(), "role", user.getRole());
  }

  @GetMapping("/public/grammar-topics")
  public Object topics() {
    return notes.topics();
  }

  @GetMapping("/public/grammar-notes")
  public Object publishedList(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(required = false) Long topic
  ) {
    return notes.list(null, page, topic);
  }

  @GetMapping("/public/grammar-notes/{slug}")
  public Object published(@PathVariable String slug) {
    return notes.published(slug);
  }

  @GetMapping("/manage/grammar-notes")
  public Object list(
    @AuthenticationPrincipal User user,
    @RequestParam(defaultValue = "0") int page
  ) {
    return notes.list(user.getId(), page, null);
  }

  @PostMapping("/manage/grammar-notes")
  public Object create(
    @AuthenticationPrincipal User user,
    @RequestBody GrammarNotes.Draft draft
  ) {
    return notes.create(user.getId(), draft);
  }

  @GetMapping("/manage/grammar-notes/{id}")
  public Object editor(
    @AuthenticationPrincipal User user,
    @PathVariable long id
  ) {
    return notes.editor(id, user.getId());
  }

  @PutMapping("/manage/grammar-notes/{id}/draft")
  public Object save(
    @AuthenticationPrincipal User user,
    @PathVariable long id,
    @RequestBody GrammarNotes.Draft draft
  ) {
    return notes.save(id, user.getId(), draft);
  }

  @PostMapping("/manage/grammar-notes/{id}/preview")
  public Object preview(
    @AuthenticationPrincipal User user,
    @PathVariable long id,
    @RequestBody GrammarNotes.Action action
  ) {
    return notes.preview(id, user.getId(), action);
  }

  @PostMapping("/manage/grammar-notes/{id}/publish")
  public Object publish(
    @AuthenticationPrincipal User user,
    @PathVariable long id,
    @RequestBody GrammarNotes.Action action
  ) {
    return notes.publish(id, user.getId(), action);
  }

  @PostMapping("/manage/grammar-notes/{id}/unpublish")
  public Object unpublish(
    @AuthenticationPrincipal User user,
    @PathVariable long id,
    @RequestBody GrammarNotes.Action action
  ) {
    return notes.hide(id, user.getId(), action.expectedVersion(), false);
  }

  @PostMapping("/manage/grammar-notes/{id}/archive")
  public Object archive(
    @AuthenticationPrincipal User user,
    @PathVariable long id,
    @RequestBody GrammarNotes.Action action
  ) {
    return notes.hide(id, user.getId(), action.expectedVersion(), true);
  }
}
