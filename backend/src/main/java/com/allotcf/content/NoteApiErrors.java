package com.allotcf.content;

import java.util.Map;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestControllerAdvice(assignableTypes = NoteApi.class)
public class NoteApiErrors {

  @ExceptionHandler(DuplicateKeyException.class)
  public ResponseEntity<?> duplicate() {
    return ResponseEntity.status(409).body(
      Map.of("error", "地址已被使用，请选择另一个地址")
    );
  }

  @ExceptionHandler(ResponseStatusException.class)
  public ResponseEntity<?> status(ResponseStatusException e) {
    return ResponseEntity.status(e.getStatusCode()).body(
      Map.of(
        "error",
        e.getReason() == null ? "无权访问或笔记不存在" : e.getReason()
      )
    );
  }
}
