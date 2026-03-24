package com.contactmgmt.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "contacts")
public class Contact {

    @Id
    private String id;

    private String name;

    @Indexed
    private String email;

    private String phone;

    private String address;

    @Builder.Default
    private boolean favorite = false;

    @Indexed
    private String ownerId;

    @CreatedDate
    private Instant createdAt;
}
