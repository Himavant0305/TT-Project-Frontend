package com.contactmgmt.controller;

import com.contactmgmt.dto.ContactRequest;
import com.contactmgmt.dto.ContactResponse;
import com.contactmgmt.dto.PagedContactsResponse;
import com.contactmgmt.service.ContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;

    @PostMapping
    public ResponseEntity<ContactResponse> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ContactRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(contactService.create(user.getUsername(), request));
    }

    @GetMapping
    public ResponseEntity<PagedContactsResponse> list(
            @AuthenticationPrincipal UserDetails user,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contactService.findAllForOwner(user.getUsername(), pageable));
    }

    @GetMapping("/search")
    public ResponseEntity<PagedContactsResponse> search(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(value = "query", required = false, defaultValue = "") String query,
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(contactService.search(user.getUsername(), query, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactResponse> getById(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        return ResponseEntity.ok(contactService.findById(user.getUsername(), id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactResponse> update(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id,
            @Valid @RequestBody ContactRequest request) {
        return ResponseEntity.ok(contactService.update(user.getUsername(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        contactService.delete(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/favorite")
    public ResponseEntity<ContactResponse> toggleFavorite(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        return ResponseEntity.ok(contactService.toggleFavorite(user.getUsername(), id));
    }

    @GetMapping("/export/csv")
    public ResponseEntity<String> exportCsv(@AuthenticationPrincipal UserDetails user) {
        String csv = contactService.exportCsv(user.getUsername());
        return ResponseEntity.ok()
                .header("Content-Type", "text/csv")
                .header("Content-Disposition", "attachment; filename=contacts.csv")
                .body(csv);
    }
}

