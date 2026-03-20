## TEST COVERAGE — web3.tv

Статусы:
  [AUTO]   — покрыто автотестом
  [TODO]   — не покрыто, нужно автоматизировать
  [MANUAL] — ручное тестирование (не автоматизируемо)

────────────────────────────────────────────────────────────────
AUTH
├── Login (email) — success                         [AUTO] tests/auth/login.spec.ts          AUTH-001
├── Login (email) — wrong password                  [AUTO] tests/auth/login.spec.ts          AUTH-002
├── Login (email) — wrong username                  [AUTO] tests/auth/login.spec.ts          AUTH-003
├── Logout                                          [AUTO] tests/auth/login.spec.ts          AUTH-004
├── Registration via email (UI)                     [AUTO] tests/auth/registration.spec.ts   AUTH-005
├── Registration via API                            [AUTO] tests/auth/registration.spec.ts   AUTH-006
├── Password reset — success                        [AUTO] tests/auth/resetPassword.spec.ts  AUTH-007
├── Password reset — password mismatch              [AUTO] tests/auth/resetPassword.spec.ts  AUTH-008
├── Login via Web3 wallet                           [AUTO] tests/auth/wallet.spec.ts         AUTH-009
├── Login via Telegram                              [MANUAL]                                 AUTH-010
├── Add email to wallet account                     [AUTO] tests/auth/wallet.spec.ts         AUTH-011
├── Registration via Web3 wallet                    [AUTO] tests/auth/wallet.spec.ts         AUTH-012
├── Register + Login via same wallet                [AUTO] tests/auth/wallet.spec.ts         AUTH-013
└── Wallet register + add email/password + login    [BLOCKED] W3-2039                        AUTH-014

────────────────────────────────────────────────────────────────
2FA
├── Setup 2FA via email                             [AUTO] tests/auth/2fa.spec.ts            2FA-001
├── Login with correct 2FA code                     [AUTO] tests/auth/2fa.spec.ts            2FA-002
├── Login with wrong 2FA code                       [AUTO] tests/auth/2fa.spec.ts            2FA-003
└── Disable 2FA                                     [AUTO] tests/auth/2fa.spec.ts            2FA-004

────────────────────────────────────────────────────────────────
ACCOUNT SETTINGS (/account)
├── Edit email address — saved successfully         [AUTO] tests/user/account/account.spec.ts ACCOUNT-001
├── Change password — saved successfully            [AUTO] tests/user/account/account.spec.ts ACCOUNT-002
├── Display wallet address (read-only)              [AUTO] tests/auth/wallet.spec.ts          ACCOUNT-003
└── Add wallet to email account                    [AUTO] tests/auth/wallet.spec.ts          ACCOUNT-005

────────────────────────────────────────────────────────────────
PROFILE SETTINGS (/profile)
├── Upload profile avatar — saved successfully      [AUTO] tests/user/profile/profile.spec.ts PROFILE-001
├── Avatar displayed in header after upload         [AUTO] tests/user/profile/profile.spec.ts PROFILE-002
├── Edit biography — saved successfully             [AUTO] tests/user/profile/profile.spec.ts PROFILE-003
├── Add/edit social links (FB, TW, IG, TikTok)     [AUTO] tests/user/profile/profile.spec.ts PROFILE-004
├── Biography max length validation (1000 chars)    [AUTO] tests/user/profile/profile.spec.ts PROFILE-005
└── Social links max length validation (100 chars)  [AUTO] tests/user/profile/profile.spec.ts PROFILE-006

────────────────────────────────────────────────────────────────
NOTIFICATIONS (/notifications)
├── Toggle all notification settings on/off         [AUTO] tests/user/notifications/notifications.spec.ts  NOTIF-001
├── Notification on channel subscription            [AUTO] tests/user/notifications/notifications.spec.ts  NOTIF-002
├── Notification on paid subscription purchase      [AUTO] tests/user/notifications/notifications.spec.ts  NOTIF-003
├── Notification when subscribed channel uploads    [BLOCKED] test.fixme                                   NOTIF-004
└── Notification on paid channel paid video upload  [AUTO] tests/user/notifications/notifications.spec.ts  NOTIF-005

────────────────────────────────────────────────────────────────
CHANNELS
├── Channel created automatically on registration   [TODO]                                   CHANNEL-001
├── Create additional channel                       [TODO]                                   CHANNEL-002
├── Channel limit: max 30                           [TODO]                                   CHANNEL-003
├── Edit channel name — saved successfully          [TODO]                                   CHANNEL-004
├── Edit channel handle — saved successfully        [TODO]                                   CHANNEL-005
├── Edit channel description — saved successfully   [TODO]                                   CHANNEL-006
├── Edit channel short description — saved          [TODO]                                   CHANNEL-007
├── Upload channel banner — saved successfully      [TODO]                                   CHANNEL-008
├── Upload channel picture — saved successfully     [TODO]                                   CHANNEL-009
├── Set channel privacy: Public → Private           [TODO]                                   CHANNEL-010
├── Set channel privacy: Private → Public           [TODO]                                   CHANNEL-011
├── Private channel: videos inaccessible to others  [TODO]                                   CHANNEL-012
├── Delete channel                                  [TODO]                                   CHANNEL-013
├── Set Highlight video                             [TODO]                                   CHANNEL-014
├── Import video via external URL (Video Importer)  [TODO]                                   CHANNEL-015
└── Mint NFT for channel (testnet)                  [MANUAL]                                 CHANNEL-016

────────────────────────────────────────────────────────────────
VIDEO UPLOAD
├── Upload horizontal video (public)                [AUTO] tests/studio/content.spec.ts      UPLOAD-001
├── Upload horizontal video (private)               [AUTO] tests/studio/content.spec.ts      UPLOAD-002
├── Upload horizontal video (unlisted)              [AUTO] tests/studio/content.spec.ts      UPLOAD-003
├── Upload horizontal video (paid)                  [AUTO] tests/studio/content.spec.ts      UPLOAD-004
├── Upload Shorts                                   [AUTO] tests/studio/content.spec.ts      UPLOAD-005
├── Upload video >50MB (chunk upload, 500 check)    [AUTO] tests/studio/content.spec.ts      UPLOAD-006
├── Upload thumbnail manually                       [AUTO] tests/studio/content.spec.ts      UPLOAD-007
├── AI autofill fields                              [TODO]                                   UPLOAD-008
└── Required fields validation (title/desc/cat)     [TODO]                                   UPLOAD-009

────────────────────────────────────────────────────────────────
VIDEO VISIBILITY
├── Public: visible to anonymous guest              [AUTO] tests/studio/content.spec.ts      VIS-001
├── Public: visible to other registered user        [AUTO] tests/studio/content.spec.ts      VIS-002
├── Private: not shown on channel page              [AUTO] tests/studio/content.spec.ts      VIS-003
├── Private: blocked on direct link for others      [AUTO] tests/studio/content.spec.ts      VIS-004
├── Unlisted: not shown on channel page             [AUTO] tests/studio/content.spec.ts      VIS-005
├── Unlisted: accessible via direct link            [AUTO] tests/studio/content.spec.ts      VIS-006
├── Paid: blocked without subscription              [AUTO] tests/studio/content.spec.ts      VIS-007
└── Paid: accessible after subscription purchase    [AUTO] tests/studio/content.spec.ts      VIS-008

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Regular Player
├── Play / pause                                    [AUTO] tests/studio/videoPlayer.spec.ts  PLAYER-001
├── currentTime advances while playing              [AUTO] tests/studio/videoPlayer.spec.ts  PLAYER-002
├── Progress bar advances while playing             [AUTO] tests/studio/videoPlayer.spec.ts  PLAYER-003
├── Dubbing available for video <1 min              [TODO]                                   PLAYER-004
├── Dubbing: switch language                        [TODO]                                   PLAYER-005
├── Hot-spots: owner sets hot-spot area             [TODO]                                   PLAYER-006
└── Hot-spots: viewer click triggers highlight      [TODO]                                   PLAYER-007

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Shorts Player
├── Shorts play (manual click, no autoplay)         [AUTO] tests/studio/videoPlayer.spec.ts  SHORTS-001
├── currentTime advances after click                [AUTO] tests/studio/videoPlayer.spec.ts  SHORTS-002
├── Shorts: swiper slide navigation                 [TODO]                                   SHORTS-003
└── Shorts: dubbing                                 [TODO]                                   SHORTS-004

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Embed Player
├── Embed player: video plays                       [TODO]                                   EMBED-001
├── Embed player: dubbing available                 [TODO]                                   EMBED-002
└── Embed player: no hot-spots                      [TODO]                                   EMBED-003

────────────────────────────────────────────────────────────────
SUBSCRIPTIONS — Free (channel follow)
├── Subscribe to channel                            [TODO]                                   SUB-001
├── Unsubscribe from channel                        [TODO]                                   SUB-002
└── Subscriptions feed shows videos from channel    [TODO]                                   SUB-003

────────────────────────────────────────────────────────────────
PAID SUBSCRIPTIONS
├── Create membership plan (owner)                  [AUTO] tests/subscription/subscriptionPlan.spec.ts  PAID-001
├── Purchase plan via Hero Pay (mock)               [AUTO] tests/subscription/subscriptionPlan.spec.ts  PAID-002
├── Access paid video after purchase                [AUTO] tests/subscription/subscriptionPlan.spec.ts  PAID-003
├── Subscription expiry → access revoked            [TODO]                                   PAID-004
└── View purchased subscriptions (/my-paid-subs)    [TODO]                                   PAID-005

────────────────────────────────────────────────────────────────
PLAYLISTS
├── Create playlist                                 [TODO]                                   PLAYLIST-001
├── Add video to playlist                           [TODO]                                   PLAYLIST-002
├── Remove video from playlist                      [TODO]                                   PLAYLIST-003
├── Delete playlist                                 [TODO]                                   PLAYLIST-004
└── Set playlist visibility (public/private)        [TODO]                                   PLAYLIST-005

────────────────────────────────────────────────────────────────
LIBRARY / HISTORY / WATCH LATER / LIKED
├── History: video appears after watching           [TODO]                                   LIB-001
├── History: Delete All clears history              [TODO]                                   LIB-002
├── Watch Later: add video                          [TODO]                                   LIB-003
├── Watch Later: remove video                       [TODO]                                   LIB-004
├── Liked Videos: like video                        [TODO]                                   LIB-005
├── Liked Videos: unlike video                      [TODO]                                   LIB-006
└── Continue Watching: Dismiss removes item         [TODO]                                   LIB-007

────────────────────────────────────────────────────────────────
COMMENTS
├── Add comment to video                            [TODO]                                   COMMENT-001
├── Reply to comment                                [TODO]                                   COMMENT-002
├── Mention user in comment                         [TODO]                                   COMMENT-003
└── Delete own comment                              [TODO]                                   COMMENT-004

────────────────────────────────────────────────────────────────
STUDIO CONTENT PAGE
├── Tabs: Videos / Shorts / Live / Playlists        [TODO]                                   STUDIO-001
├── Sort by column (Upload Date, Views, etc.)       [TODO]                                   STUDIO-002
├── Filter videos                                   [TODO]                                   STUDIO-003
└── Action menu: edit video                         [TODO]                                   STUDIO-004

────────────────────────────────────────────────────────────────
HOME PAGE
├── Crypto ticker displayed                         [TODO]                                   HOME-001
├── Category filter: filter videos by category      [TODO]                                   HOME-002
├── Recommended for You section visible             [TODO]                                   HOME-003
└── Continue Watching: Dismiss removes item         [TODO]                                   HOME-004

────────────────────────────────────────────────────────────────
SEARCH (/search)
├── Search by keyword returns videos                [TODO]                                   SEARCH-001
├── Search: Shorts tab                              [TODO]                                   SEARCH-002
└── Search: Channels tab                            [TODO]                                   SEARCH-003

────────────────────────────────────────────────────────────────
HERO / CRYPTO
└── HERO coins displayed in header                  [AUTO] tests/hero/heroIntegration.spec.ts  HERO-001

────────────────────────────────────────────────────────────────
VALIDATION
├── Username — min/max length                       [AUTO] tests/validation/usernameValidation.spec.ts  VAL-001
├── Username — allowed characters                   [AUTO] tests/validation/usernameValidation.spec.ts  VAL-002
├── Handle — min/max length                         [AUTO] tests/validation/handleValidation.spec.ts    VAL-003
├── Handle — allowed characters (lowercase, no spaces) [AUTO] tests/validation/handleValidation.spec.ts VAL-004
├── Handle — uniqueness check                       [AUTO] tests/validation/handleValidation.spec.ts    VAL-005
├── Video title — required field                    [TODO]                                   VAL-006
├── Video description — required field              [TODO]                                   VAL-007
├── Video category — required field                 [TODO]                                   VAL-008
├── Channel name — max 32 chars                     [TODO]                                   VAL-009
├── Channel description — max 1000 chars            [TODO]                                   VAL-010
├── Channel short description — max 100 chars       [TODO]                                   VAL-011
├── Biography — max 1000 chars                      [TODO]                                   VAL-012
└── Social links — max 100 chars each               [TODO]                                   VAL-013

────────────────────────────────────────────────────────────────
VISUAL REGRESSION
├── Desktop Chromium snapshot                       [MANUAL] Docker only                     VISUAL-001
└── Mobile iPhone 15 WebKit snapshot               [MANUAL] Docker only                     VISUAL-002
