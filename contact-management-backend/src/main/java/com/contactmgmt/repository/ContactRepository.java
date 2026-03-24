package com.contactmgmt.repository;

import com.contactmgmt.model.Contact;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends MongoRepository<Contact, String> {

    Page<Contact> findByOwnerId(String ownerId, Pageable pageable);

    Optional<Contact> findByIdAndOwnerId(String id, String ownerId);

    List<Contact> findByOwnerIdAndIdIn(String ownerId, List<String> ids);

    long countByOwnerId(String ownerId);

    List<Contact> findTop5ByOwnerIdOrderByCreatedAtDesc(String ownerId);

    @Query("{ 'ownerId': ?0, $or: [ { 'name': { $regex: ?1, $options: 'i' } }, { 'email': { $regex: ?1, $options: 'i' } } ] }")
    Page<Contact> searchByOwnerId(String ownerId, String regexPattern, Pageable pageable);

    boolean existsByOwnerIdAndEmailIgnoreCase(String ownerId, String email);
}
