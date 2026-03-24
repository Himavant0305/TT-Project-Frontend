package com.contactmgmt.service;

import com.contactmgmt.dto.ContactRequest;
import com.contactmgmt.dto.ContactResponse;
import com.contactmgmt.dto.DashboardStatsResponse;
import com.contactmgmt.dto.PagedContactsResponse;
import com.contactmgmt.exception.DuplicateResourceException;
import com.contactmgmt.exception.ResourceNotFoundException;
import com.contactmgmt.model.Contact;
import com.contactmgmt.repository.ContactGroupRepository;
import com.contactmgmt.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final ContactGroupRepository groupRepository;

    public ContactResponse create(String ownerId, ContactRequest request) {
        // Duplicate detection
        if (contactRepository.existsByOwnerIdAndEmailIgnoreCase(ownerId, request.getEmail().trim())) {
            throw new DuplicateResourceException("A contact with this email already exists");
        }

        Contact contact = Contact.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .phone(request.getPhone().trim())
                .address(request.getAddress() != null ? request.getAddress().trim() : "")
                .ownerId(ownerId)
                .build();
        return toResponse(contactRepository.save(contact));
    }

    public PagedContactsResponse findAllForOwner(String ownerId, Pageable pageable) {
        Page<Contact> page = contactRepository.findByOwnerId(ownerId, pageable);
        return toPaged(page);
    }

    public PagedContactsResponse search(String ownerId, String query, Pageable pageable) {
        if (query == null || query.isBlank()) {
            return findAllForOwner(ownerId, pageable);
        }
        String safe = Pattern.quote(query.trim());
        Page<Contact> page = contactRepository.searchByOwnerId(ownerId, safe, pageable);
        return toPaged(page);
    }

    public ContactResponse findById(String ownerId, String id) {
        Contact contact = contactRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
        return toResponse(contact);
    }

    public ContactResponse update(String ownerId, String id, ContactRequest request) {
        Contact contact = contactRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));

        // Duplicate detection (skip if email unchanged)
        String newEmail = request.getEmail().trim();
        if (!contact.getEmail().equalsIgnoreCase(newEmail)
                && contactRepository.existsByOwnerIdAndEmailIgnoreCase(ownerId, newEmail)) {
            throw new DuplicateResourceException("A contact with this email already exists");
        }

        contact.setName(request.getName().trim());
        contact.setEmail(newEmail);
        contact.setPhone(request.getPhone().trim());
        contact.setAddress(request.getAddress() != null ? request.getAddress().trim() : "");
        return toResponse(contactRepository.save(contact));
    }

    public ContactResponse toggleFavorite(String ownerId, String id) {
        Contact contact = contactRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
        contact.setFavorite(!contact.isFavorite());
        return toResponse(contactRepository.save(contact));
    }

    public void delete(String ownerId, String id) {
        Contact contact = contactRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Contact not found"));
        groupRepository.findByOwnerIdAndContactIdsContaining(ownerId, id).forEach(group -> {
            if (group.getContactIds() == null) {
                return;
            }
            group.getContactIds().removeIf(contactId -> contactId.equals(id));
            groupRepository.save(group);
        });
        contactRepository.delete(contact);
    }

    public String exportCsv(String ownerId) {
        List<Contact> all = contactRepository.findByOwnerId(ownerId,
                org.springframework.data.domain.PageRequest.of(0, 10000,
                        org.springframework.data.domain.Sort.by("name"))).getContent();
        StringBuilder sb = new StringBuilder();
        sb.append("Name,Email,Phone,Address,Favorite\n");
        for (Contact c : all) {
            sb.append(csvEscape(c.getName())).append(',')
              .append(csvEscape(c.getEmail())).append(',')
              .append(csvEscape(c.getPhone())).append(',')
              .append(csvEscape(c.getAddress())).append(',')
              .append(c.isFavorite() ? "Yes" : "No")
              .append('\n');
        }
        return sb.toString();
    }

    public DashboardStatsResponse dashboardStats(String ownerId) {
        long total = contactRepository.countByOwnerId(ownerId);
        List<ContactResponse> recent = contactRepository.findTop5ByOwnerIdOrderByCreatedAtDesc(ownerId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return DashboardStatsResponse.builder()
                .totalContacts(total)
                .recentContacts(recent)
                .build();
    }

    private PagedContactsResponse toPaged(Page<Contact> page) {
        return PagedContactsResponse.builder()
                .content(page.getContent().stream().map(this::toResponse).collect(Collectors.toList()))
                .page(page.getNumber())
                .size(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .last(page.isLast())
                .build();
    }

    private ContactResponse toResponse(Contact c) {
        return ContactResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .address(c.getAddress())
                .favorite(c.isFavorite())
                .ownerId(c.getOwnerId())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private String csvEscape(String val) {
        if (val == null) return "";
        if (val.contains(",") || val.contains("\"") || val.contains("\n")) {
            return "\"" + val.replace("\"", "\"\"") + "\"";
        }
        return val;
    }
}

