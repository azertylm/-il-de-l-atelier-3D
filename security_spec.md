# Security Specification - L'Œil de l'Atelier

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be created, read, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
2. **Sub-resource Invariant**: Any sub-resource under `/users/{userId}/*` (such as artworks, history, guestbook) belongs strictly to that user, and write operations must enforce that the incoming document's `userId` matches `request.auth.uid`.
3. **Guestbook Visitor Creation**: Any visitor can submit a guestbook entry to `/users/{userId}/guestbook/{guestbookId}` as long as the payload validates against the strict schema, and only the artist (`userId == request.auth.uid`) can delete or modify entries.
4. **Temporal Invariant**: Creation timestamps must be validated against `request.time` or valid ISO dates within safe limits.
5. **No Blind Escalation**: Role can only be one of `['artist', 'gallerist', 'visitor_collector']`.

## 2. The "Dirty Dozen" Payloads (Must all return PERMISSION_DENIED)
1. **Payload 1 (Ghost User ID)**: Unauthenticated attempt to write to `/users/victim_123`.
2. **Payload 2 (Cross-User Overwrite)**: User `auth.uid = "user_A"` trying to update `/users/user_B`.
3. **Payload 3 (Role Injection)**: User attempting to set `role: "super_admin"` outside the allowed enum.
4. **Payload 4 (Oversized Bio DOS)**: User sending a bio string exceeding 3,000 characters.
5. **Payload 5 (Path Traversal ID)**: Document ID containing illegal characters (e.g., `../../hack`).
6. **Payload 6 (Orphan Artwork)**: User attempting to create an artwork under another user's path.
7. **Payload 7 (Oversized Artwork Title)**: Artwork with title length > 250 characters.
8. **Payload 8 (Foreign History Injection)**: User injecting analysis history into another user's account.
9. **Payload 9 (Oversized Analysis Result DOS)**: History payload exceeding 50,000 characters.
10. **Payload 10 (Unauthorized Guestbook Deletion)**: A third party attempting to delete an artist's guestbook entries.
11. **Payload 11 (Oversized Guestbook Message)**: Guestbook comment with message length > 2000 characters.
12. **Payload 12 (Blanket Read Bypass)**: Querying the entire `/users` collection without user-scoped filter.
