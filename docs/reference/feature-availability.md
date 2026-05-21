# Feature availability (web vs API)

> **Navigation:** [Reference INDEX](INDEX.md) · [Master INDEX](../INDEX.md)

Use this matrix when writing tutorials or testing — avoids documenting UI that does not exist yet.

| Feature | Web UI | API | Notes |
|---------|--------|-----|-------|
| Register / login | Yes | Yes | Verification gate when SMTP configured |
| Garden dashboard | Yes | — | Schedule preview, weather, plants |
| Add plant | Yes | Yes | No `notes` field on web form |
| Task calendar | Yes | Yes | 14 past / 45 future days; All / Upcoming filter |
| Complete / skip task | Yes | Yes | Dashboard + calendar (checkbox); profile (Done only, no skip) |
| Task instructions | Yes | Yes | Modal from dashboard, calendar, profile |
| Change plant location | Yes | Yes | Profile dropdown; reschedules pending tasks |
| Dr. Plant chat | Yes | Yes | Profile section; requires OpenAI for best results |
| One-shot diagnosis | No (create) | Yes | Create via Swagger/API; profile shows past rows only |
| Journal (text) | Yes | Yes | Profile text field |
| Journal photo | No | Yes | Multipart on API |
| Plant identify (photo) | Yes | Yes | Add plant flow; monthly quota on free tier |
| Settings / weather | Yes | Yes | Lat/lon for rain skip |
| Account delete | Yes | Yes | Settings page |
| Premium / Stripe checkout | Partial | Yes | Gating relaxed in MVP (`ALL_USERS_PREMIUM`, JWT override) |
| Push notifications | Partial | Yes | Device token API; delivery hooks vary by env |

When adding UI for a row marked **No**, update this file and the [master feature map](../INDEX.md#feature--documentation-map).
