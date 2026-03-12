# Test Coverage

## auth.spec.ts — Authentication

### Login
- Success login as user
- Success logout
- Can't login with incorrect password
- Can't login with incorrect username

### Sign Up
- Register user via Email
- Register and verify user via API

### Forgot Password
- Reset password: old → error, new → success
- Can't reset with mismatched passwords

---

## user.spec.ts — Account Settings

### Change Password
- Update without email verify → old works, new fails
- Verify via email → new works, old fails

### Change Email
- Old email works before verify, new fails
- After verify: new works, old fails

### Change Avatar
- Change user avatar and check new avatar is displayed

### 2FA
- Setup 2FA
- Login with incorrect code → Failed
- Login with correct code → Success
- Disable 2FA

---

## subscriptionPlan.spec.ts — Subscription & Paid Content

### Paid Video Suite
- Create user + set channel public
- Create subscription plan
- Upload paid video
- Anonymous → video not available
- Logged in → buy membership → video available

---

## heroIntegration.spec.ts — HERO Integration

- Check hero icons

---

## studio/content.spec.ts — Video Upload

- Public video
- Private video
- Paid video
- Unlisted video
- Upload video >50mb workflow
- Upload public short video (Shorts)

---

## studio/channel.spec.ts — Channel Management *(TODO — not implemented)*

- Create / delete channel
- Edit: banner, picture, privacy, name & handle, description
- Edit: video importer, highlighted video
- Home page: membership, videos/shorts sorting, playlists, counters

---

## validation/handleValidation.spec.ts — Handle Validation

Covers **Edit Channel** and **Create Channel** pages:

1. Empty handle → *Username is required*
2. Too short → *Username must be at least 4 characters*
3. Too long → *Max length of handle is 32 characters*
4. Non-latin chars → *Handle must start with a letter and contain only latin lowercase letters, digits, and underscores*
5. Spaces → rejected
6. Starting underscore → rejected
7. Already exists
8. Uppercase → converted to lowercase

---

## validation/usernameValidation.spec.ts — Username Validation

Covers **Registration** page:

1. Empty → *Username is required*
2. Too short → *Username must be at least 4 characters*
3. Too long → *Max length of username is 32 characters*
4. Non-latin chars → rejected
5. Spaces → rejected
6. Starting underscore → rejected
7. Already exists
8. Uppercase → converted to lowercase
