package com.contactmgmt.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ContactResponse {

    private String id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private boolean favorite;
    private String ownerId;
    private Instant createdAt;
}
