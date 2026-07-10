## TEST COVERAGE — ai.tv (web3.tv)

Статусы:
  [AUTO]     — покрыто автотестом
  [CRITICAL] — входит в critical suite (smoke перед деплоем), tag: @critical
  [TODO]     — не покрыто, нужно автоматизировать
  [MANUAL]   — ручное тестирование (не автоматизируемо)
  [BLOCKED]  — ждет фикса / выключено (test.fixme, describe.skip, tests/skip/)

Запуск:
  npm run test:critical    — только @critical тесты (smoke)
  npm run test:regression  — все функциональные тесты

────────────────────────────────────────────────────────────────
AUTH — EMAIL
├── Login (email) — success                         [AUTO][CRITICAL] tests/auth/emailAuth.spec.ts  AUTH-001
├── Login (email) — wrong password                  [AUTO] tests/auth/emailAuth.spec.ts      AUTH-002
├── Login — nonexistent username → not-found error  [AUTO] tests/auth/emailAuth.spec.ts (красный до фикса: фронт кажет generic «Something went wrong» вместо «No account found», баг зарепорчен W3-2725 c.43239 п.2)  AUTH-003
├── Login — nonexistent email → not-found error     [AUTO] tests/auth/emailAuth.spec.ts      AUTH-018
├── Logout                                          [AUTO] tests/auth/emailAuth.spec.ts      AUTH-004
├── Registration via email (UI popup)               [AUTO][CRITICAL] tests/auth/emailAuth.spec.ts  AUTH-005
├── Registration via API + login via popup          [AUTO] tests/auth/emailAuth.spec.ts      AUTH-006
├── Password reset — success (old fails, new works) [AUTO] tests/auth/emailAuth.spec.ts      AUTH-007
├── Password reset — password mismatch              [AUTO] tests/auth/emailAuth.spec.ts      AUTH-008
├── Password reset — phone number in reset form     [TODO] ждёт решения команды: убрать телефон или сделать reset по телефону (W3-2725 c.43239 п.3)  AUTH-019
├── Wrong verification code ×5 → too many attempts  [AUTO] tests/auth/emailAuth.spec.ts      AUTH-009
├── Sign Up with already registered email (W3-2725) [AUTO] tests/auth/emailAuth.spec.ts      AUTH-017
└── Login via Telegram (mocked OAuth)               [AUTO] tests/auth/telegramAuth.spec.ts   AUTH-015

────────────────────────────────────────────────────────────────
AUTH — PHONE
├── Login via phone — success                       [AUTO][CRITICAL] tests/auth/phoneAuth.spec.ts  PHONE-AUTH-001
├── Login via phone — wrong password                [AUTO] tests/auth/phoneAuth.spec.ts      PHONE-AUTH-003
└── Registration via phone (UI popup, static OTP)   [AUTO][CRITICAL] tests/auth/phoneAuth.spec.ts  PHONE-AUTH-004

────────────────────────────────────────────────────────────────
AUTH — WALLET
├── Registration via Web3 wallet (MetaMask)         [AUTO][CRITICAL] tests/auth/walletAuth.spec.ts AUTH-012
├── Register + Login via same wallet                [AUTO] tests/auth/walletAuth.spec.ts     AUTH-013
├── Add email to wallet account                     [AUTO] tests/auth/walletAuth.spec.ts     AUTH-011
├── Register and login via 25+ wallets (loop)       [AUTO] tests/auth/walletAuth.spec.ts     SMOKE-WALLET-<type>
│   MetaMask, Hero, Binance, Trust, SafePal, Fireblocks, OKX, TokenPocket, Bitget,
│   Uniswap, Ledger Live, Zerion, Best, Crypto.com, Bifrost, xPortal, Bitcoin.com,
│   1inch, Trezor, Blockchain.com, imToken, BitPay, Gemini, Arculus, Ctrl, Ronin
├── Wallet register + add email/password + login    [BLOCKED] W3-2039                        AUTH-014
└── Add email to wallet twice without verification  [BLOCKED] test.fixme tests/auth/walletAuth.spec.ts  AUTH-016

────────────────────────────────────────────────────────────────
2FA — suite выключена (describe.skip в tests/auth/emailAuth.spec.ts)
├── Setup 2FA via email                             [BLOCKED] describe.skip tests/auth/emailAuth.spec.ts  2FA-001
├── Login with correct 2FA code                     [BLOCKED] describe.skip tests/auth/emailAuth.spec.ts  2FA-002
├── Login with wrong 2FA code                       [BLOCKED] describe.skip tests/auth/emailAuth.spec.ts  2FA-003
└── Disable 2FA                                     [BLOCKED] describe.skip tests/auth/emailAuth.spec.ts  2FA-004

────────────────────────────────────────────────────────────────
EMAIL TEMPLATES (W3-2662)
├── Verification code email — content & security    [AUTO] tests/auth/emailTemplates.spec.ts EMAIL-001
├── Welcome email — content                         [AUTO] tests/auth/emailTemplates.spec.ts EMAIL-002
├── Password reset email — content, link & security [AUTO] tests/auth/emailTemplates.spec.ts EMAIL-003
├── Password changed email — content                [AUTO] tests/auth/emailTemplates.spec.ts EMAIL-004
├── New device / suspicious login email             [BLOCKED] не реализовано в бэке (W3-2662) EMAIL-005
└── Coming-soon (pre-subscribed) video release email [AUTO] tests/api/comingSoonEmail.spec.ts EMAIL-006

────────────────────────────────────────────────────────────────
ACCOUNT SETTINGS (/account)
├── Edit email address — saved successfully         [BLOCKED] test.fixme W3-2730 tests/account/account.spec.ts  ACCOUNT-001
├── Change password — saved successfully            [AUTO] tests/account/account.spec.ts     ACCOUNT-002
├── Display wallet address (read-only)              [AUTO] tests/auth/walletAuth.spec.ts     ACCOUNT-003
├── Add wallet to email account                     [AUTO] tests/auth/walletAuth.spec.ts     ACCOUNT-005
├── Change password twice in one session            [BLOCKED] test.fixme W3-2731 tests/account/account.spec.ts  ACCOUNT-006
├── Change email then change password (unverified)  [BLOCKED] test.fixme W3-2730 tests/account/account.spec.ts  ACCOUNT-007
└── Change email twice without verification         [BLOCKED] test.fixme W3-2730 tests/account/account.spec.ts  ACCOUNT-008

────────────────────────────────────────────────────────────────
PROFILE SETTINGS (/profile) — suite в test.fixme (WIP)
├── Upload profile avatar — saved successfully      [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-001
├── Avatar displayed in header after upload         [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-002
├── Edit biography — saved successfully             [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-003
├── Add/edit social links (FB, TW, IG, TikTok)      [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-004
├── Biography max length validation (1000 chars)    [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-005
└── Social links max length validation (100 chars)  [BLOCKED] test.fixme tests/account/profile.spec.ts  PROFILE-006

────────────────────────────────────────────────────────────────
NOTIFICATIONS (/notifications) — suite в test.fixme (WIP)
├── Toggle all notification settings on/off         [BLOCKED] test.fixme tests/account/notifications.spec.ts  NOTIF-001
├── Notification on channel subscription            [BLOCKED] test.fixme tests/account/notifications.spec.ts  NOTIF-002
├── Notification on paid subscription purchase      [BLOCKED] test.fixme tests/account/notifications.spec.ts  NOTIF-003
├── Notification when subscribed channel uploads    [BLOCKED] test.fixme tests/account/notifications.spec.ts  NOTIF-004
└── Notification on paid channel paid video upload  [BLOCKED] test.fixme tests/account/notifications.spec.ts  NOTIF-005

────────────────────────────────────────────────────────────────
AI.TV — COMING SOON / NOTIFY ON RELEASE (W3-2641)
├── Subscribed user gets release notification when coming-soon video publishes  [AUTO] tests/content/manage/scheduledVideoNotify.spec.ts  AITV-001
└── Unsubscribed user gets no release notification  [AUTO] tests/content/manage/scheduledVideoNotify.spec.ts  AITV-002

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
├── Set default video description in channel settings — saved successfully  [AUTO] tests/content/channel/channel.spec.ts  CHANNEL-017
├── Default description auto-fills description field when opening upload popup  [AUTO] tests/content/channel/channel.spec.ts  CHANNEL-018
├── Override pre-filled description — video saved with custom description  [AUTO] tests/content/channel/channel.spec.ts  CHANNEL-019
├── Clear default description — upload popup opens with empty description  [AUTO] tests/content/channel/channel.spec.ts  CHANNEL-020
└── Auto-created channel: handle as name, без суффикса "Channel"  [AUTO] tests/content/channel/channel.spec.ts  CHANNEL-021

────────────────────────────────────────────────────────────────
NFT — suite в test.fixme
  Wallet user registers, opens Studio Settings → NFT section, converts channel
  via HeroPay mock payment, verifies minting status and NFT details (ERC 721,
  token contract, explorer link)
├── Convert channel to NFT via mock payment          [BLOCKED] test.fixme tests/content/manage/nftConversion.spec.ts  NFT-001
└── Email user without wallet sees add wallet popup  [BLOCKED] test.fixme tests/content/manage/nftConversion.spec.ts  NFT-002

────────────────────────────────────────────────────────────────
VIDEO UPLOAD
├── Upload horizontal video (public)                [TODO] (covered by MOVIE-001)               UPLOAD-001
├── Upload horizontal video (private)               [TODO]                                      UPLOAD-002
├── Upload horizontal video (unlisted)              [TODO]                                      UPLOAD-003
├── Upload horizontal video (paid)                  [TODO]                                      UPLOAD-004
├── Upload Shorts                                   [TODO] (covered by SHORTS-003)              UPLOAD-005
├── Upload video >50MB (chunk upload, 500 check)    [AUTO] tests/content/upload/uploadMovie.spec.ts     UPLOAD-006
├── Upload thumbnail manually                       [TODO] (спек удалён при переходе на stepped modal W3-2702)  UPLOAD-007
├── AI autofill fields via AI button                [TODO]                                      UPLOAD-008
├── Required fields validation (title/desc/cat)     [AUTO] tests/content/upload/uploadVideoValidation.spec.ts  UPLOAD-009
├── Delete video during upload                      [TODO]                                      UPLOAD-010
├── Save video as draft                             [TODO]                                      UPLOAD-011
├── Select auto-generated thumbnail                 [TODO] (спек удалён при переходе на stepped modal W3-2702)  UPLOAD-012
└── Publish video while still processing            [TODO] (obsolete by design — stepped modal blocks publish until processed)  UPLOAD-013

────────────────────────────────────────────────────────────────
CONTENT CREATION FLOW — Movie / Series / Shorts (W3-2702)
├── Create a Movie end-to-end (type→details→2 covers→finalize→success)  [AUTO][CRITICAL] tests/content/upload/uploadMovie.spec.ts   MOVIE-001
├── Any type selectable for any orientation (W3-2714)         [AUTO] tests/content/upload/uploadMovie.spec.ts    MOVIE-002
├── Create a new Series with its first episode (New Series)   [AUTO][CRITICAL] tests/content/upload/uploadSeries.spec.ts  SERIES-001
├── Add a new Episode to an existing Series (New Episode)     [AUTO][CRITICAL] tests/content/upload/uploadSeries.spec.ts   SERIES-002
├── Shorts details: category locked to "Shorts", single cover [AUTO][CRITICAL] tests/content/upload/uploadShorts.spec.ts  SHORTS-001
├── Shorts: Associated movie/series toggle reveals selector   [AUTO] tests/content/upload/uploadShorts.spec.ts   SHORTS-002
└── Publish a Short end-to-end                                [AUTO][CRITICAL] tests/content/upload/uploadShorts.spec.ts  SHORTS-003

────────────────────────────────────────────────────────────────
UPLOAD TAXONOMY — categories & genres in the modal (W3-2729)
├── Movie: Category dropdown == expected video categories      [AUTO] tests/content/upload/uploadTaxonomy.spec.ts   CATEGORIES-UI-001
├── Series: Category dropdown == expected episode categories   [AUTO] tests/content/upload/uploadTaxonomy.spec.ts   CATEGORIES-UI-002
└── Genres dropdown == expected genres (59)                    [AUTO] tests/content/upload/uploadTaxonomy.spec.ts   GENRES-UI-001

────────────────────────────────────────────────────────────────
VIDEO GENERATION (AI) — POST /video-generations (W3-2747)
  Флоу (со слов бэка): запись в БД video_generations создаётся 1:1 с задачей
  в сервисе генерации; каждые 5 мин крон-команда опрашивает статус у сервиса
  и обновляет его у нас; затем асинхронный импорт готового видео в s3 →
  создаётся запись video → стандартный флоу транскодинга.
  Body: channelId, prompt, ratio (напр. 9:16), duration (сек), generateAudio, watermark.
  Генерация — сервис seedance. Крон: */5 * * * * php bin/console video:generations:poll;
  ту же команду (bin/console video:generations:poll в поде бэка) можно дёрнуть вручную,
  чтобы не ждать 5 мин — проверяет статус у seedance и создаёт video у нас.
├── Create generation task via API → задача создана, запись в video_generations  [TODO] @db  VIDGEN-001
├── Status sync: сервис завершил задачу → статус обновлён у нас     [TODO] @db              VIDGEN-002
├── Готовое видео импортировано в s3 → создана запись video          [TODO]                  VIDGEN-003
├── Сгенерированное видео проходит транскодинг и играет в плеере     [TODO]                  VIDGEN-004
├── Параметры учтены: ratio/duration/audio/watermark соответствуют   [TODO]                  VIDGEN-005
├── Validation: невалидные параметры (prompt/ratio/duration) → 4xx   [TODO]                  VIDGEN-006
├── Unauthorized (без токена) → 401                                  [TODO]                  VIDGEN-007
├── Чужой channelId → 403                                            [TODO]                  VIDGEN-008
└── Failed generation → статус failed, видео не создаётся            [TODO] @db              VIDGEN-009

────────────────────────────────────────────────────────────────
VIDEO MANAGE — description / studio search
├── Description preserves empty paragraphs on video page       [AUTO] tests/content/manage/videoDescription.spec.ts  DESC-PARA-001
├── Studio search filters videos by title                      [AUTO] tests/content/manage/studioSearch.spec.ts STUDIO-017
├── Studio search does NOT match by description                [AUTO] tests/content/manage/studioSearch.spec.ts STUDIO-018
└── Studio search filters shorts by title                      [AUTO] tests/content/manage/studioSearch.spec.ts STUDIO-019

────────────────────────────────────────────────────────────────
VIDEO VISIBILITY
├── Public: visible on channel page                 [AUTO][CRITICAL] tests/content/manage/videoVisibility.spec.ts  VIS-001
├── Public: visible to anonymous guest              [AUTO][CRITICAL] tests/content/manage/videoVisibility.spec.ts  VIS-001
├── Public: visible to other registered user        [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-002
├── Private: not shown on channel page              [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-003
├── Private: blocked on direct link (anonymous)     [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-003
├── Private: blocked on direct link (other user)    [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-004
├── Unlisted: not shown on channel page             [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-005
├── Unlisted: accessible via direct link (anon)     [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-005
├── Unlisted: accessible via direct link (user)     [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-006
├── Paid: badges on channel page                    [BLOCKED] describe.skip tests/content/manage/videoVisibility.spec.ts  VIS-007
├── Paid: paywall for anonymous                     [BLOCKED] describe.skip tests/content/manage/videoVisibility.spec.ts  VIS-007
└── Paid: subscribe button for other user           [TODO] (теста нет)                        VIS-008

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Regular Player
├── Play / pause                                    [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-001
├── currentTime advances while playing              [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-002
├── Progress bar advances while playing             [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-003
├── Series: episode auto-advances to next on end    [AUTO][CRITICAL] tests/player/seriesPlayback.spec.ts  SERIES-003
├── Dubbing available for video <1 min              [TODO]                                   PLAYER-004
├── Dubbing: switch language                        [TODO]                                   PLAYER-005
├── Hot-spots: owner sets hot-spot area             [TODO]                                   PLAYER-006
└── Hot-spots: viewer click triggers highlight      [TODO]                                   PLAYER-007

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Shorts Player
├── Shorts play (manual click, no autoplay)         [AUTO] tests/player/videoPlayer.spec.ts  SHORTS-001
├── currentTime advances after click                [AUTO] tests/player/videoPlayer.spec.ts  SHORTS-002
├── Shorts: swiper slide navigation                 [TODO]                                   SHORTS-003
└── Shorts: dubbing                                 [TODO]                                   SHORTS-004

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Embed Player
├── Embed player: video plays                       [AUTO][CRITICAL] tests/player/embedPlayer.spec.ts   EMBED-001
├── Embed player: short plays                       [AUTO] tests/player/embedPlayer.spec.ts   EMBED-002
├── Embed player: dubbing available                 [AUTO] tests/player/embedPlayer.spec.ts   EMBED-003
└── Embed player: no hot-spots                      [AUTO] tests/player/embedPlayer.spec.ts   EMBED-004

────────────────────────────────────────────────────────────────
SUBSCRIPTIONS — Free (channel follow)
├── Subscribe to channel                            [TODO]                                   SUB-001
├── Unsubscribe from channel                        [TODO]                                   SUB-002
└── Subscriptions feed shows videos from channel    [TODO]                                   SUB-003

────────────────────────────────────────────────────────────────
PAID SUBSCRIPTIONS — suite запаркована в tests/skip/ (исключено из прогонов)
├── Create membership plan (owner)                  [BLOCKED] tests/skip/subscription/paidSubscription.spec.ts    PAID-001
├── Purchase plan via Hero Pay (mock)               [BLOCKED] tests/skip/subscription/paidSubscription.spec.ts    PAID-002
├── Access paid video after purchase                [BLOCKED] tests/skip/subscription/paidSubscription.spec.ts    PAID-003
├── Create membership plan via UI (studio)          [TODO]                                                PAID-004
├── Subscription expiry → access revoked + restore  [BLOCKED] tests/skip/subscription/paidSubscription.spec.ts    PAID-005
├── Active subscription on /my-paid-subs            [BLOCKED] tests/skip/subscription/paidSubsStatus.spec.ts      PAID-006
├── Expired subscription on /my-paid-subs           [BLOCKED] tests/skip/subscription/paidSubsStatus.spec.ts      PAID-007
├── Pending payment status on /my-paid-subs         [BLOCKED] tests/skip/subscription/paidSubsStatus.spec.ts      PAID-008
└── Payment expired status on /my-paid-subs         [BLOCKED] tests/skip/subscription/paidSubsStatus.spec.ts      PAID-009

────────────────────────────────────────────────────────────────
AUTH POPUP ("Almost there!") — suite запаркована в tests/skip/
  Shown when anonymous user tries to subscribe or access paid content.
├── Anonymous user sees Subscribe Now button on membership page  [BLOCKED] tests/skip/subscription/authPopup.spec.ts  AUTH-POP-007
├── Clicking Subscribe Now shows auth popup (Create account + Login)  [BLOCKED] tests/skip/subscription/authPopup.spec.ts  AUTH-POP-008
├── Auth popup: Create account button → navigates to register   [BLOCKED] tests/skip/subscription/authPopup.spec.ts  AUTH-POP-009
├── Auth popup: Login button → navigates to login page          [BLOCKED] tests/skip/subscription/authPopup.spec.ts  AUTH-POP-010
└── Auth popup: closes when clicking close button               [BLOCKED] tests/skip/subscription/authPopup.spec.ts  AUTH-POP-011

────────────────────────────────────────────────────────────────
PLAYLISTS
  Main domain (/playlists) — shows only user's personal playlists
  Studio domain (/playlists) — shows only the active channel's playlists
├── Create playlist                                 [TODO]                                   PLAYLIST-001
├── Add video to playlist                           [TODO]                                   PLAYLIST-002
├── Remove video from playlist                      [TODO]                                   PLAYLIST-003
├── Delete playlist                                 [TODO]                                   PLAYLIST-004
├── Set playlist visibility (public/private)        [TODO]                                   PLAYLIST-005
├── Main domain: only user playlists shown          [TODO]                                   PLAYLIST-006
└── Studio domain: only channel playlists shown     [TODO]                                   PLAYLIST-007

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
├── Sort by Uploading date (asc/desc)               [TODO]                                   STUDIO-002
├── Sort by Publish date (asc/desc)                 [TODO]                                   STUDIO-003
├── Sort by Most Views (asc/desc)                   [TODO]                                   STUDIO-004
├── Sort by Most Comments (asc/desc)                [TODO]                                   STUDIO-005
├── Sort by Visibility (asc/desc)                   [TODO]                                   STUDIO-006
├── Sort by Title (asc/desc)                        [TODO]                                   STUDIO-007
├── Filter by visibility: Public                    [TODO]                                   STUDIO-008
├── Filter by visibility: Private                   [TODO]                                   STUDIO-009
├── Filter by visibility: Paid                      [TODO]                                   STUDIO-010
├── Filter by visibility: Unlisted                  [TODO]                                   STUDIO-011
├── Filter by status: Published                     [TODO]                                   STUDIO-012
├── Filter by status: Draft                         [TODO]                                   STUDIO-013
├── Filter: multiple checkboxes combined            [TODO]                                   STUDIO-014
├── Filter: Reset clears all filters                [TODO]                                   STUDIO-015
└── Action menu: edit video                         [TODO]                                   STUDIO-016
    (поиск по студии — см. VIDEO MANAGE: STUDIO-017..019)

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
└── HERO coins displayed in header                  [TODO] (спек удалён)                     HERO-001

────────────────────────────────────────────────────────────────
VALIDATION (tag: @validation)
├── Handle (registration) — min/max length          [AUTO] tests/auth/handleValidationOnRegPage.spec.ts  VAL-001
├── Handle (registration) — allowed characters      [AUTO] tests/auth/handleValidationOnRegPage.spec.ts  VAL-002
├── Handle (create channel) — min/max length        [AUTO] tests/content/channel/handleValidationOnEditPage.spec.ts  VAL-003
├── Handle (create channel) — allowed characters    [AUTO] tests/content/channel/handleValidationOnEditPage.spec.ts  VAL-004
├── Handle (create channel) — uniqueness check      [AUTO] tests/content/channel/handleValidationOnEditPage.spec.ts  VAL-005
│   (вариант для Edit Channel Page — в describe.fixme там же)
├── Video title — required field                    [AUTO] tests/content/upload/uploadVideoValidation.spec.ts  VAL-006
├── Video description — required field              [AUTO] tests/content/upload/uploadVideoValidation.spec.ts  VAL-007
├── Video category — required field                 [AUTO] tests/content/upload/uploadVideoValidation.spec.ts  VAL-008
├── Video category — no error shown when empty      [BLOCKED] W3-2066                        VAL-008a
├── Channel name — max 32 chars                     [TODO]                                   VAL-009
├── Channel description — max 1000 chars            [TODO]                                   VAL-010
├── Channel short description — max 100 chars       [TODO]                                   VAL-011
├── Biography — max 1000 chars                      [TODO]                                   VAL-012
├── Social links — max 100 chars each               [TODO]                                   VAL-013
├── Sign Up — username instead of email → error     [AUTO] tests/auth/handleValidationOnRegPage.spec.ts  VAL-014
├── Sign Up — invalid email format → error          [AUTO] tests/auth/handleValidationOnRegPage.spec.ts (красный до фикса: фронт кажет generic «Something went wrong» вместо ошибки валидации, баг зарепорчен W3-2725 c.43239 п.2)  VAL-015
├── Sign Up — existing username → error             [AUTO] tests/auth/handleValidationOnRegPage.spec.ts  VAL-016
└── Sign Up — existing phone number → error         [AUTO] tests/auth/handleValidationOnRegPage.spec.ts  VAL-017

────────────────────────────────────────────────────────────────
STUDIO DOMAIN (studio.web3tv.dev) — W3-1943
  Studio separated to studio.web3tv.dev, main platform stays on web3tv.dev
├── Studio sidebar: correct items for logged user   [TODO]                                   STUDIO-DOMAIN-001
│   Dashboard, Content, Analytics, Memberships, Playlists, Edit channel, Settings, Send Feedback
├── Main sidebar: no studio items for logged user   [TODO]                                   STUDIO-DOMAIN-002
│   Home, Subscription, Library, History, Continue Watching, My playlists, Watch Later, Liked Videos
├── Studio sidebar: hidden for anonymous user       [TODO]                                   STUDIO-DOMAIN-003
├── Anonymous user on studio domain → redirect to main  [TODO]                               STUDIO-DOMAIN-004
├── Upload button on main → redirect to studio      [TODO]                                   STUDIO-DOMAIN-005
├── Search bar hidden on studio domain              [TODO]                                   STUDIO-DOMAIN-006
├── Edit channel click → popup (Cancel/OK) to main  [TODO]                                   STUDIO-DOMAIN-007
├── Non-studio pages on studio → redirect to main   [TODO]                                   STUDIO-DOMAIN-008
├── Studio notifications: filtered types only       [TODO]                                   STUDIO-DOMAIN-009
│   channel_subscription, paid_channel_subscription, comment_reply, ai_metadata_failed, ai_metadata_success
├── Main domain notifications: all types shown      [TODO]                                   STUDIO-DOMAIN-010
└── Logout redirects to baseUrl (main domain /)     [TODO]                                   STUDIO-DOMAIN-011

────────────────────────────────────────────────────────────────
ANALYTICS (studio.web3tv.dev/analytics) — W3-881, tag: @db
  Channel owner views analytics dashboard with seeded statistics.
  Data seeded via DB: views, likes, comments, subscribers across multiple days.
├── Summary cards: Views and Subscribers displayed             [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Charts: main chart (views) and engagement chart visible    [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Chart switch: click Subscribers card → subscribers chart   [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Engagement (48h): likes count matches seeded data          [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Latest Uploaded Content: title, views, likes, comments     [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Top Content: uploaded video present in table               [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Period: Last 7 days — chart data + newSubscribers filtered [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Period: Last 28 days — chart data includes all views       [AUTO] tests/content/manage/analytics.spec.ts  ANALY-001
├── Summary for selected period (not lifetime)                 [TODO] W3-2449 (BE task)               ANALY-002
├── topContent includes video links                            [TODO] W3-2449 (BE task)               ANALY-003
├── Non-owner access → 403                                     [TODO]                                  ANALY-004
├── Unauthenticated access → 401                               [TODO]                                  ANALY-005
└── Channel with no videos — empty state                       [AUTO] tests/content/manage/analytics.spec.ts  ANALY-006

────────────────────────────────────────────────────────────────
VIDEO CHAPTERS (W3-2434)
├── English video → chapters non-empty, sorted, enabled       [AUTO] tests/api/videoChapters.spec.ts  CHAP-001
├── English video → chapters_generation_success notification  [AUTO] tests/api/videoChapters.spec.ts  CHAP-002
├── Short video → no chapters generated                       [AUTO] tests/api/videoChapters.spec.ts  CHAP-003
├── Non-English video → no chapters                           [TODO] test.fixme, no fixture              CHAP-004
├── chapters_enabled=false → chapters still returned          [TODO] (теста нет)                         CHAP-005
├── Re-transcription → old chapters replaced atomically       [TODO] test.fixme, no re-trigger API       CHAP-006
├── ML failure → chapters_generation_failed notification      [BLOCKED] not in MVP (no failed notif type) CHAP-007
└── Empty ML response → chapters untouched                    [BLOCKED] cannot control OpenAI response    CHAP-008

────────────────────────────────────────────────────────────────
PRODUCTION SMOKE (prodSmoke project, ENV_FILE=.env.prod)
├── Login — success                                 [AUTO] tests/production/prodSmoke.spec.ts  PROD-001
├── Register via email                              [AUTO] tests/production/prodSmoke.spec.ts  PROD-002
├── Register via wallet                             [AUTO] tests/production/prodSmoke.spec.ts  PROD-003
├── Upload private video                            [AUTO] tests/production/prodSmoke.spec.ts  PROD-004
├── Video player plays video                        [AUTO] tests/production/prodSmoke.spec.ts  PROD-005
├── Home page visual                                [BLOCKED] describe.skip tests/production/prodSmoke.spec.ts  PROD-VIS-001
└── Studio page visual                              [BLOCKED] describe.skip tests/production/prodSmoke.spec.ts  PROD-VIS-002

────────────────────────────────────────────────────────────────
VISUAL REGRESSION (Docker only; фикстура @qavischan — npm run seed:fixture)
├── Desktop: main page / header / auth modal / hover preview   [AUTO] tests/visual/desktop/aitvVisual.spec.ts        VIS-AITV-001..006
├── Desktop: studio sidebar / header / dashboard / content     [AUTO] tests/visual/desktop/studioVisual.spec.ts      VIS-STD-001..004
├── Desktop: upload modal Movie/Series/Shorts × 3 шага         [AUTO] tests/visual/desktop/uploadModalVisual.spec.ts VIS-UPL-001..009
├── Desktop: video page + channel page (anon/user/owner)       [AUTO] tests/visual/desktop/videoChannelVisual.spec.ts VIS-VCH-001..005
├── Desktop: listing dropdowns movies/series/shorts            [AUTO] tests/visual/desktop/listingVisual.spec.ts     VIS-LIST-001..003
├── Mobile: header / dropdown / auth modal                     [AUTO] tests/visual/mobile/aitvVisual.spec.ts         VIS-AITV-MOB-003..006
├── Mobile: video page + channel page (anon/user/owner)        [AUTO] tests/visual/mobile/videoChannelVisual.spec.ts VIS-MOB-001..005
└── Mobile: listing dropdowns movies/series/shorts             [AUTO] tests/visual/mobile/listingVisual.spec.ts      VIS-LIST-MOB-001..003
