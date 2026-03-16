# Test Coverage

```
tests/
├── auth/auth.spec.ts — Authentication
│   ├── Login
│   │   ├── Success login as user
│   │   ├── Success logout
│   │   ├── Can't login with incorrect password
│   │   └── Can't login with incorrect username
│   ├── Sign Up
│   │   ├── Register user via Email
│   │   └── Register and verify user via API
│   └── Forgot Password
│       ├── Reset password: old → error, new → success
│       └── Can't reset with mismatched passwords
│
├── user/user.spec.ts — Account Settings
│   ├── Change Password
│   │   ├── Update without email verify → old works, new fails
│   │   └── Verify via email → new works, old fails
│   ├── Change Email
│   │   ├── Old email works before verify, new fails
│   │   └── After verify: new works, old fails
│   ├── Change Avatar
│   │   └── Change user avatar and check new avatar is displayed
│   └── 2FA
│       ├── Setup 2FA
│       ├── Login with incorrect code → Failed
│       ├── Login with correct code → Success
│       └── Disable 2FA
│
├── subscription/subscriptionPlan.spec.ts — Subscription & Paid Content
│   └── Paid Video Suite
│       ├── Create user + set channel public
│       ├── Create subscription plan
│       ├── Upload paid video
│       ├── Anonymous → video not available
│       └── Logged in → buy membership → video available
│
├── hero/heroIntegration.spec.ts — HERO Integration
│   └── Check hero icons
│
├── studio/
│   ├── content.spec.ts — Video Upload & Visibility
│   │   ├── Public video
│   │   │   ├── Upload public video → available on studio page
│   │   │   ├── Channel page → available (anonymous)
│   │   │   ├── Direct link → available (anonymous)
│   │   │   └── Direct link → available (another user)
│   │   ├── Private video
│   │   │   ├── Upload private video → available on studio page
│   │   │   ├── Channel page → not available (anonymous)
│   │   │   ├── Direct link → unavailable (anonymous)
│   │   │   └── Direct link → unavailable (another user)
│   │   ├── Paid video
│   │   │   ├── Create subscription plan
│   │   │   ├── Upload paid video → available on studio page
│   │   │   ├── Channel page → available (anonymous preview)
│   │   │   ├── Direct link → unavailable (anonymous)
│   │   │   └── Direct link → unavailable (another user without subscription)
│   │   ├── Unlisted video
│   │   │   ├── Upload unlisted video → available on studio page
│   │   │   ├── Channel page → not listed (anonymous)
│   │   │   ├── Direct link → available (anonymous)
│   │   │   └── Direct link → available (another user)
│   │   ├── Upload video >50mb workflow
│   │   │   └── Upload large video (chunk upload, 500 error check)
│   │   └── Shorts
│   │       ├── Upload public short → available on studio page
│   │       ├── Channel page → available (anonymous)
│   │       ├── Direct link → available (anonymous)
│   │       └── Direct link → available (another user)
│   ├── videoPlayer.spec.ts — Video Player Playback
│   │   ├── Video player plays uploaded video (regular video, play + currentTime advances)
│   │   └── Video player plays uploaded short (shorts, play + currentTime advances)
│   └── channel.spec.ts — Channel Management *(TODO — not implemented)*
│       ├── Create / delete channel
│       ├── Edit: banner, picture, privacy, name & handle, description
│       ├── Edit: video importer, highlighted video
│       └── Home page: membership, videos/shorts sorting, playlists, counters
│
└── validation/
    ├── handleValidation.spec.ts — Handle Validation
    │   └── Edit Channel / Create Channel pages
    │       ├── Empty handle → Username is required
    │       ├── Too short → Username must be at least 4 characters
    │       ├── Too long → Max length of handle is 32 characters
    │       ├── Non-latin chars → Handle must start with a letter and contain only latin lowercase letters, digits, and underscores
    │       ├── Spaces → rejected
    │       ├── Starting underscore → rejected
    │       ├── Already exists
    │       └── Uppercase → converted to lowercase
    └── usernameValidation.spec.ts — Username Validation
        └── Registration page
            ├── Empty → Username is required
            ├── Too short → Username must be at least 4 characters
            ├── Too long → Max length of username is 32 characters
            ├── Non-latin chars → rejected
            ├── Spaces → rejected
            ├── Starting underscore → rejected
            ├── Already exists
            └── Uppercase → converted to lowercase
```
