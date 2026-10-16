# Family Apostolate Matrimony – REST API contract (for the backend developer)

The React front end calls **only** the functions in `src/api/http.js`. This document lists every endpoint, the data it sends and the data it expects back.
A complete working reference implementation of every rule below is in `src/api/mock/mockApi.js` (runs in the browser), so you can compare behaviour.

- Base URL: `VITE_API_BASE_URL` (default `/api`). During development Vite proxies `/api` → `API_PROXY_TARGET` (default `http://localhost:8000`).
- Format: JSON (`Content-Type: application/json`), except the two upload endpoints (multipart).
- Auth: `Authorization: Bearer <token>` – token returned by `POST /auth/login`.
- Errors: any non-2xx status with body `{ "message": "Human readable text" }`. The message is shown to the user as is.
  Use 401 (not logged in), 403 (not allowed / account not active), 404, 409 (duplicate email), 422 (validation), 423 (account on hold).
- Dates: `YYYY-MM-DD` for dates, ISO-8601 for timestamps.

---

## 1. Data models

### Member (as returned to the member themself and to admins)
```jsonc
{
  "id": "FATA261021",
  "name": "Joseph Mathew", "gender": "Male",          // Male | Female
  "dob": "1997-03-14", "age": 29,                       // age computed by backend
  "email": "joseph@demo.com", "mobile": "+91 9447012345",
  "height": 178, "weight": 72, "bloodGroup": "O+",
  "diocese": "Thrissur Archdiocese", "parish": "St. Sebastian's Church, Punkunnam", "place": "Thrissur",
  "community": "Syro-Malabar", "maritalStatus": "Never Married", "motherTongue": "Malayalam", "languages": "English, Malayalam",
  "eduGroup": "B.Tech / M.Tech", "education": "B.Tech – Computer Science",
  "jobGroup": "Engineer", "job": "Software Engineer", "employer": "", "income": "6 – 12 Lakh",
  "location": "Thrissur, Kerala",
  "family": { "father": "", "mother": "", "brothers": "", "sisters": "", "type": "Nuclear", "native": "", "phone": "" },
  "interests": ["Music", "Travel"],
  "quote": "…", "about": "…",
  "photos": ["https://…/p1.jpg", "https://…/p2.jpg", "https://…/p3.jpg"],   // [0]=passport, [1]=full length, [2]=other angle
  "preferences": { "ageMin": 24, "ageMax": 30, "heightMin": 150, "heightMax": 172, "education": "Any", "location": "Within Kerala" },
  "regDate": "2026-09-02", "approvedDate": "2026-09-04", "expiryDate": "2027-03-04",
  "status": "active",            // EFFECTIVE status – see §2
  "daysLeft": 139,               // expiryDate – today (null if not approved)
  "payment": { "amount": 500, "paid": true, "mode": "UPI", "txn": "TXN8818321", "date": "2026-09-02" },
  "idProof": { "type": "Aadhaar Card", "file": "aadhaar_front.pdf", "verified": true, "url": "https://… (admin only)" },
  "hold": null | Hold,
  "marriage": null | Marriage,
  "remarks": "",                 // rejection reason / office note
  "views": 317, "lastActive": "2026-10-13T09:30:00Z"
}
```
Admin responses additionally include `accountStatus` (the stored status before computing hold/expiry). In the demo the mock also returns `password` so the office can see demo logins – **never do this in production**.

### Public profile (another member, seen by a logged-in member)
Same as Member **without** `email, mobile, payment, idProof, hold, marriage, remarks, password`, plus:
```jsonc
{ "idVerified": true,
  "contact": null | { "email": "…", "mobile": "…" },   // ONLY when the two members are a mutual match
  "relation": { "myDecision": null | "like" | "pass" | "fav" | "block", "likesMe": true, "mutual": false } }
```

### Hold
```jsonc
{ "status": "requested" | "active" | "ended" | "rejected" | "cancelled",
  "months": 2, "reason": "Going abroad…", "requestedAt": "2026-10-14T18:20:00Z",
  "from": "2026-10-16", "until": "2026-12-16",           // set when approved / placed
  "decidedAt": "…", "decidedBy": "Fr. Admin", "note": "Approved. Subscription extended by 2 months.",
  "resumedAt": "…", "releasedBy": "…" }
```

### Marriage
```jsonc
{ "date": "2026-09-14", "spouseName": "Alan Varghese", "viaPlatform": true, "partnerId": "FATA261025",
  "shareStory": true, "note": "Thank you!", "reportedAt": "2026-10-12T19:30:00Z", "reportedBy": "member" | "<admin name>" }
```

### Others
- **Message** `{ id, from, to, text, at }`
- **Notification** (office → member) `{ id, to, type: approved|hold|renewal|renewed, text, at, read }`
- **Enquiry** `{ id, type: contact|story, memberId|null, name, email, phone, subject, message, at, status: open|closed }`
- **Article** `{ id, title, img, date, category, read, summary, body: [paragraph, …] }`
- **Story** `{ id, couple, img, married, parish, text, story }`

---

## 2. Business rules

**Effective status** (field `status`), computed on every read:
| status | rule |
|---|---|
| `pending` | registered, not yet approved by the office |
| `rejected` | office rejected (reason in `remarks`) |
| `married` | member reported marriage, or office marked it → **hidden everywhere, waiting for deletion** |
| `on_hold` | stored status active **and** `hold.status = active` **and** `hold.from ≤ today < hold.until` |
| `expired` | active but `expiryDate < today` |
| `expiring` | active and `expiryDate − today ≤ 30` days (`settings.reminderDays`) |
| `active` | everything else that is approved |

- **Login** is allowed only for `active`, `expiring`, `on_hold`. Others get **403** with a clear message (see mock `login`).
- **Membership**: ₹ 500 for 6 months (`settings.planFee`, `settings.planMonths`). Approval sets `approvedDate = today`, `expiryDate = today + 6 months`. Approval requires `payment.paid = true`.
- **Visibility**: a member only ever sees members of the **opposite gender** whose status is `active` or `expiring`, who are not blocked either way.
- **Match**: when A and B both have decision `like` or `fav` for each other they are a mutual match. Only mutual matches can message each other and see `contact`.
- **Hold** (new):
  - Member requests 1–`settings.maxHoldMonths` (6) months with a reason → `hold.status = requested`. Only `active`/`expiring` members; one open request at a time; member can cancel.
  - Admin approves (can change the months) → `from = today`, `until = today + months`, `status = active`, and **`expiryDate` is extended by the same months**. Admin may reject with a mandatory note. Admin can also place a hold directly, and release it early.
  - While on hold: hidden from search/match/likes/matches lists; member can log in but every member endpoint except `/me/profile`, `/me/summary`, `/me/hold*`, `/me/married` returns **423**.
  - Resume / release early: `until = today`, `hold.status = ended`, and the unused days are taken back off `expiryDate`.
  - When `until` passes, the hold ends automatically (`hold.status = ended`).
  - Each decision creates a Notification for the member.
- **Married** (new):
  - Member submits `POST /me/married` → stored status `married`, `marriage` filled, **session ends** (token invalid), profile hidden immediately. If `shareStory` is true, also create an Enquiry of type `story`.
  - Admin sees them in `GET /admin/married`, verifies, and deletes the account (`DELETE /admin/members/:id` removes profile, photos, likes, messages, notifications).
  - Admin can restore a mistaken report with `PATCH /admin/members/:id {status:"active", marriage:null}`.

---

## 3. Endpoints

### Auth
| Method & path | Body / query | Returns |
|---|---|---|
| `POST /auth/login` | `{ username, password, role: "member"|"admin" }` (member username = email **or** 10-digit mobile) | `{ token, role, user }` (`user` = Member for members, `{id,name,role}` for admins) |
| `GET /auth/me` | – | `{ role, user }` (401 if token invalid / account no longer active) |
| `POST /auth/logout` | – | `{ ok: true }` |

### Public
| Method & path | Body / query | Returns |
|---|---|---|
| `GET /lookups` | – | `{ dioceses[], eduGroups[], jobGroups[], settings }` |
| `GET /stats/public` | – | `{ members, active, couples, dioceses }` |
| `GET /articles` · `GET /articles/:id` | – | Article[] (newest first) · Article |
| `GET /stories` | – | Story[] |
| `POST /enquiries` | `{ type, name, email, phone, subject, message }` | `{ ok: true }` |
| `POST /members/register` | **multipart**: `data` = JSON string of Member fields + `password` + `paymentMode` (UPI/Card/Net Banking/Office); files `photos` (3–4, order = passport, full length, other, extra), `idProof`, `parishLetter` (optional) | `{ id, email, status: "pending" }` (409 if email exists) |

### Member (logged in)
| Method & path | Body / query | Returns |
|---|---|---|
| `GET /me/profile` | – | Member + `stats: { matches, likedMe }` + `notifications: Notification[] (latest 6)` |
| `GET /me/summary` | – | `{ unread, likedMe, notices, matches }` (header bell) |
| `POST /me/notifications/read` | – | `{ ok: true }` |
| `POST /me/hold` | `{ months, reason }` | Member |
| `DELETE /me/hold` | – (cancel pending request) | Member |
| `POST /me/hold/resume` | – | Member |
| `POST /me/married` | `{ date, spouseName, viaPlatform, partnerId|null, shareStory, note }` | `{ ok: true }` – and invalidate the token |
| `GET /me/discover` | query: `ageMin ageMax heightMin heightMax eduGroup jobGroup diocese sort(new|age|active|likedMe) undecidedOnly(bool)` | PublicProfile[] |
| `GET /profiles/:id` | – (increments `views`) | PublicProfile (404 if not visible to this member) |
| `POST /profiles/:id/decision` | `{ type: like|pass|fav|block }` | `{ type, mutual }` |
| `POST /profiles/:id/report` | `{ reason }` | `{ ok: true }` |
| `GET /me/matches` | – | `[{ member: PublicProfile, lastMessage: Message|null, unread }]` newest conversation first |
| `GET /me/liked-me` | – | PublicProfile[] (liked me, I haven't decided) |
| `GET /me/messages/:id` | – (marks thread read) | Message[] oldest first (403 if not mutual) |
| `POST /me/messages/:id` | `{ text }` | Message |

### Admin
| Method & path | Body / query | Returns |
|---|---|---|
| `GET /admin/summary` | – | `{ total, counts: {pending, active, expiring, expired, on_hold, married, rejected}, newThisMonth, holdRequests, marriedToDelete, openEnquiries, reports }` |
| `GET /admin/members` | query `status (all|pending|active|expiring|on_hold|expired|married|rejected)`, `q`, `sort (new|old by regDate)` | Member[] (paginate server-side if you like: add `page`, `pageSize`, return `{items,total}` and tell the front-end dev) |
| `GET /admin/members/:id` | – | Member |
| `POST /admin/members` | **multipart** like register (`data`, `photos`, `idProof`), `data.paid` = paid at office | `{ id }` |
| `PATCH /admin/members/:id` | any editable Member fields | Member |
| `POST /admin/members/:id/photos` | multipart `index` (0–2), `photo` | Member |
| `POST /admin/members/:id/payment` | `{ paid }` | Member |
| `POST /admin/members/:id/id-verified` | `{ verified }` | Member |
| `POST /admin/members/:id/approve` | – | Member (422 if unpaid) |
| `POST /admin/members/:id/reject` | `{ remarks }` (required) | Member |
| `POST /admin/members/:id/renew` | – (payment received at office) | Member |
| `POST /admin/members/:id/married` | `{ date?, spouseName? }` | Member |
| `DELETE /admin/members/:id` | – | `{ ok: true }` |
| `POST /admin/notifications/renewal` | `{ ids: [] }` (send email + SMS) | `{ sent }` |
| `GET /admin/holds` | query `status = requested|active|all` | Member[] (with `hold`) |
| `POST /admin/members/:id/hold/decision` | `{ approve: bool, months?, note? }` (note required when rejecting) | Member |
| `POST /admin/members/:id/hold` | `{ months, reason }` – place hold directly | Member |
| `DELETE /admin/members/:id/hold` | – release hold early | Member |
| `GET /admin/married` | – | Member[] with `marriage` (newest report first) |
| `GET /admin/reports/monthly` | query `month=YYYY-MM` | `{ newReg, approved, active, inactive, onHold, married, pending, rejected, expiredIn, revenue, rows: [{id,name,gender,diocese,regDate,expiryDate,paid,amount,status}] }` |
| `GET /admin/reports/trend` | query `months=7` | `[{ month: "YYYY-MM", active, newReg, inactive, onHold }]` |
| `GET /admin/enquiries` | query `status = open|closed|all` | Enquiry[] |
| `PATCH /admin/enquiries/:id` | `{ status }` | Enquiry |

### Scheduled jobs (backend)
- Daily: end holds whose `until` has passed; send renewal reminders 30 days before `expiryDate`; send an expiry notice on the day it expires.
- Payment gateway (Razorpay / PayU) callback should set `payment.paid = true` with `mode` and `txn`.
- Send email/SMS for: registration received, approved, rejected, hold approved/rejected, renewal reminder.
