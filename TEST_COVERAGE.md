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
├── Wallet register + add email/password + login    [AUTO] tests/auth/walletAuth.spec.ts     AUTH-014
└── Unverified email not attached / address free    [AUTO] tests/auth/walletAuth.spec.ts     AUTH-020

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
├── Change email then change password (unverified)  [AUTO] tests/account/account.spec.ts     ACCOUNT-007
├── Change email twice without verification         [BLOCKED] test.fixme W3-2730 tests/account/account.spec.ts  ACCOUNT-008
└── Add email to phone-registered account           [BLOCKED] test.fixme W3-2910 tests/accountSettings/security.spec.ts  ACCOUNT-012

────────────────────────────────────────────────────────────────
PROFILE SETTINGS (модалка Edit на /account)
├── Upload profile avatar — saved successfully      [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-001
├── Avatar displayed in profile header after upload [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-002
├── Edit biography — saved successfully             [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-003
├── Add/edit social links (FB, X, IG, TikTok)       [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-004
├── Biography max length validation (200 chars)     [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-005
└── Social links max length validation (100 chars)  [AUTO] tests/accountSettings/profile.spec.ts  PROFILE-006

────────────────────────────────────────────────────────────────
AI.TV — COMING SOON / NOTIFY ON RELEASE (W3-2641, reworked W3-2789: delivery is follower-based)
├── Channel follower gets release notification when coming-soon video publishes  [AUTO] tests/content/manage/scheduledVideoNotify.spec.ts  AITV-001
├── Unfollowed user gets no release notification  [AUTO] tests/content/manage/scheduledVideoNotify.spec.ts  AITV-002
└── Notify-on-release bell toggles and state persists (no delivery since W3-2789)  [AUTO] tests/content/manage/scheduledVideoNotify.spec.ts  AITV-003

────────────────────────────────────────────────────────────────
AITV HEADER NOTIFICATIONS POPUP (W3-2748)
├── Bell opens popup (title + controls)                          [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-001
├── Popup closes on Escape / outside click                        [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-002
├── Fresh user: empty state, no badge, controls disabled          [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-003
├── Unread badge count + popup lists rows                         [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-004
├── Comment reply → Activity section                              [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-005
├── Hover row → seen event, badge clears                          [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-006
├── Click follow row → clicked event + nav (/studio)              [BLOCKED] test.fixme — follow notifs are hourly-grouped (W3-2848), not seedable synchronously  NOTIF-POPUP-007
├── Mark all as read: batch, badge reset, persists after reload   [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-008
├── Settings gear → /account?tab=notifications                    [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-009
├── "Show older notifications" disabled stub                      [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-010
├── Followed channel upload → For-you notification → opens video  [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-011
├── Badge caps at "9+"                                            [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-012
├── Settings toggles (/account?tab=notifications) default ON + persist  [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-013
├── Weekly watchlist notification                                 [BLOCKED] no backend type/producer (W3-2748 grooming)  NOTIF-POPUP-B01
├── New episodes in started/completed series                      [BLOCKED] no backend type/producer (W3-2748 grooming)  NOTIF-POPUP-B02
└── "Someone liked your comment" (aggregated)                     [BLOCKED] no backend type/producer (W3-2748 grooming)  NOTIF-POPUP-B03

────────────────────────────────────────────────────────────────
NOTIFICATION TARGET URLS — notification type x content type (W3-2923)
Every row = click the notification, assert the resulting URL (and the comment anchor
where applicable). Episode rows are the ones W3-2923 broke: the FE uses the raw payload
type as the first path segment, so episodes resolve to a non-existent /episode/... route.
├── comment/reply on a VIDEO -> /video/{cat}/{slug}?comment={id}          [TODO] seed: seedCommentReplies()                      NOTIF-URL-001
├── comment/reply on an EPISODE -> episode watch URL + comment anchor     [TODO] seed: setupSeriesWithEpisodes() + CommentsApi   NOTIF-URL-002
├── comment/reply on a SHORT -> /short/shorts/{slug}?comment={id}         [TODO] seed: seedCommentReplies() on a short           NOTIF-URL-003
├── video_release for a VIDEO -> video watch URL                          [AUTO] tests/notifications/notificationsPopup.spec.ts  NOTIF-POPUP-011
├── video_release for an EPISODE -> episode watch URL                     [TODO] seed: setupSeriesWithEpisodes(), slow transcode NOTIF-URL-004
├── video_release for a SHORT -> /short/shorts/{slug}                     [TODO] covered manually only                           NOTIF-URL-005
├── ai_metadata_success -> /studio/content?edit={videoId}                 [TODO] delivery only checked today (CHAP-002 analogue) NOTIF-URL-006
├── chapters_generation_success -> /studio/content?edit={videoId}         [TODO] delivery covered (CHAP-002), click/URL is not   NOTIF-URL-007
├── follow (channel_subscription) -> channel URL, NOT /studio             [TODO] needs a trigger: `notifications:aggregate-grouped --hours=N` (no pods/exec rights) or a DB-seeded row (@db). Expectation changed by W3-2923 — NOTIF-POPUP-007 still asserts /studio  NOTIF-URL-008
├── video_like on VIDEO / EPISODE -> video/episode watch URL              [TODO] same trigger problem as NOTIF-URL-008 (hourly grouping, W3-2848); URL-only assertion can run off a DB-seeded row (@db)  NOTIF-URL-009
├── comment_like -> video/episode watch URL + comment anchor              [TODO] same trigger problem as NOTIF-URL-008 (hourly grouping, W3-2848)  NOTIF-URL-010
├── rec_video -> video/episode watch URL                                  [N/A] no such type in the backend NotificationType enum — dead branch in Notification.tsx  NOTIF-URL-011
├── channel_transfer_sent / _received -> /@{channelHandleName}            [BLOCKED] fires off an on-chain NFT handle transfer (ChannelTransferredNotificationSendHandler), no REST route; payload also lacks channelHandleName  NOTIF-URL-012
└── live_stream -> /livestream/{id}                                       [TODO] fully seedable over REST: POST /live-streams/ + PUT /live-streams/status  NOTIF-URL-013

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
├── Upload Shorts                                   [TODO] (covered by SHORTS-003)              UPLOAD-005
├── Upload video >50MB (multipart direct-to-S3)     [AUTO] tests/content/upload/uploadMovie.spec.ts     UPLOAD-006
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
CONTENT EDIT — тип контента не слетает при правке (W3-2906)
├── Edit episode title → тип остаётся Series/episode (в серии, не в type=video)  [AUTO] tests/content/manage/editContentType.spec.ts  EDIT-001
├── Edit video title → тип остаётся video                     [AUTO] tests/content/manage/editContentType.spec.ts  EDIT-002
└── Edit short title → тип остаётся short                     [AUTO] tests/content/manage/editContentType.spec.ts  EDIT-003

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
└── Unlisted: accessible via direct link (user)     [AUTO] tests/content/manage/videoVisibility.spec.ts  VIS-006

────────────────────────────────────────────────────────────────
VIDEO PLAYER — Regular Player
├── Play / pause                                    [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-001
├── currentTime advances while playing              [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-002
├── Progress bar advances while playing             [AUTO][CRITICAL] tests/player/videoPlayer.spec.ts  PLAYER-003
├── Series: episode auto-advances to next on end    [AUTO][CRITICAL] tests/player/seriesPlayback.spec.ts  SERIES-003
├── Series: under-player episodes popup switches episode  [AUTO]     tests/player/seriesPlayback.spec.ts  SERIES-004
├── Series: "Next episode" pill navigates to next episode  [AUTO]    tests/player/seriesPlayback.spec.ts  SERIES-005
├── Series: episode selector shows "Episode X / Y" counter  [AUTO]   tests/player/seriesPlayback.spec.ts  SERIES-006
├── Dubbing available for video <1 min              [TODO]                                   PLAYER-004
├── Dubbing: switch language                        [TODO]                                   PLAYER-005
├── Hot-spots: owner sets hot-spot area             [TODO]                                   PLAYER-006
├── Hot-spots: viewer click triggers highlight      [TODO]                                   PLAYER-007
├── Fullscreen rail: like sends POST /videos/rate and activates icon        [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-001
├── Fullscreen rail: dislike overrides like (sequential rate requests)     [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-002
├── Fullscreen rail: comments panel opens in fullscreen, comment posted    [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-003
├── Fullscreen rail: share dialog opens, portaled into fullscreen element  [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-004
├── Fullscreen rail: guest like → auth-required popup, no rate request     [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-005
└── Fullscreen rail: comments panel closes on fullscreen exit              [AUTO] tests/player/fullscreenRail.spec.ts  FSRAIL-006

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
PLAYLISTS
  Main domain (/playlists) — shows only user's personal playlists
  Studio domain (/playlists) — shows only the active channel's playlists
├── Create series from studio content page          [AUTO][CRITICAL] tests/content/manage/createSeriesModal.spec.ts  PLAYLIST-001
├── Add video to series via kebab menu              [AUTO][CRITICAL] tests/content/manage/addToSeries.spec.ts  PLAYLIST-002
├── Remove video from playlist                      [TODO]                                   PLAYLIST-003
├── Delete series from Series tab                   [AUTO][CRITICAL] tests/content/manage/studioDelete.spec.ts  PLAYLIST-004
├── Set series visibility (public → private)        [AUTO] tests/content/manage/studioChangeVisibility.spec.ts  PLAYLIST-005
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
├── Filter by visibility: Unlisted                  [TODO]                                   STUDIO-011
├── Filter by status: Published                     [TODO]                                   STUDIO-012
├── Filter by status: Draft                         [TODO]                                   STUDIO-013
├── Filter: multiple checkboxes combined            [TODO]                                   STUDIO-014
├── Filter: Reset clears all filters                [TODO]                                   STUDIO-015
└── Action menu: edit video                         [TODO]                                   STUDIO-016
    (поиск по студии — см. VIDEO MANAGE: STUDIO-017..019)

  Редизайн страницы Content (W3-2815) — вью, табы, bulk-меню, кебаб
├── Grid/table toggle switches the listing          [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-020
├── View mode persists (URL + local storage)        [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-021
├── Tabs filter by content type                     [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-022
├── Empty channel: empty state + upload CTA         [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-023
├── Series tab hides the filter control             [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-024
├── Search with no matches → reset filters state    [AUTO] tests/content/manage/studioViewToggle.spec.ts  STUDIO-025
├── Delete a video from its kebab menu              [AUTO][CRITICAL] tests/content/manage/studioDelete.spec.ts  STUDIO-026
├── Delete confirmation Cancel deletes nothing      [AUTO] tests/content/manage/studioDelete.spec.ts  STUDIO-027
├── Kebab items differ per content type             [AUTO] tests/content/manage/studioKebabMenu.spec.ts  STUDIO-028
├── Manage Episodes is rendered disabled (by design)[AUTO] tests/content/manage/studioKebabMenu.spec.ts  STUDIO-029
├── Series row links to its episodes page           [AUTO] tests/content/manage/studioKebabMenu.spec.ts  STUDIO-030
├── Selecting content shows/hides the bulk bar      [AUTO] tests/content/manage/studioBulkBar.spec.ts  BULK-001
├── Select all marks every listed item              [AUTO] tests/content/manage/studioBulkBar.spec.ts  BULK-002
├── Episode in selection disables series actions    [AUTO] tests/content/manage/studioBulkBar.spec.ts  BULK-003
├── Draft in selection disables change visibility   [TODO]                                   BULK-004
├── Series tab: only delete + change visibility     [AUTO] tests/content/manage/studioBulkBar.spec.ts  BULK-005
├── Bulk delete removes every selected video        [AUTO][CRITICAL] tests/content/manage/studioDelete.spec.ts  BULK-007
├── Bulk change visibility for two videos           [AUTO] tests/content/manage/studioChangeVisibility.spec.ts  BULK-008
├── Bulk add two videos to a series                 [AUTO] tests/content/manage/addToSeries.spec.ts  BULK-009
├── Create unlisted series                          [BLOCKED] БАГ: POST/PUT /playlists/ → 422 на privacyStatus=unlisted  SERIES-UI-001
├── Series title/description limits (2-100 / 200)   [AUTO] tests/content/manage/createSeriesModal.spec.ts  SERIES-UI-003
├── Duplicate series title is rejected              [AUTO] tests/content/manage/createSeriesModal.spec.ts  SERIES-UI-004
├── Private video → only private series offered     [BLOCKED] БАГ FE: фильтр читает кэш неверным ключом  SERIES-UI-011
├── Change video visibility public → private        [AUTO][CRITICAL] tests/content/manage/studioChangeVisibility.spec.ts  VISCHG-001
├── Submit disabled while current visibility chosen [AUTO] tests/content/manage/studioChangeVisibility.spec.ts  VISCHG-002
├── Video without category blocks visibility change [TODO] (нужен сидинг видео без категории)  VISCHG-003
└── Change series visibility to unlisted            [BLOCKED] БАГ: PUT /playlists/ → 422 на privacyStatus=unlisted  VISCHG-010

────────────────────────────────────────────────────────────────
HOME PAGE
├── Crypto ticker displayed                         [TODO]                                   HOME-001
├── Category filter: filter videos by category      [TODO]                                   HOME-002
├── Recommended for You section visible             [TODO]                                   HOME-003
└── Continue Watching: Dismiss removes item         [TODO]                                   HOME-004

────────────────────────────────────────────────────────────────
SEARCH (global search modal — W3-2692)
├── Search by keyword returns videos (All tab)      [AUTO] tests/search/globalSearch.spec.ts SEARCH-001
├── Keyword search matches video description         [AUTO] tests/search/globalSearch.spec.ts SEARCH-051
├── Search: Shorts tab                              [AUTO] tests/search/globalSearch.spec.ts SEARCH-002
├── Search: Channels tab (by handle) + navigate     [AUTO] tests/search/globalSearch.spec.ts SEARCH-003
├── All tab: parallel video+shorts+channel fan-out  [AUTO] tests/search/globalSearch.spec.ts SEARCH-004
├── Movies tab: standalone videos (series excluded) [AUTO] tests/search/globalSearch.spec.ts SEARCH-005
├── Series tab: series content (standalone excluded)[AUTO] tests/search/globalSearch.spec.ts SEARCH-006
├── Modal opens from header + input autofocused     [AUTO] tests/search/globalSearch.spec.ts SEARCH-010
├── Modal closes via close button and Escape        [AUTO] tests/search/globalSearch.spec.ts SEARCH-011
├── Result card click navigates + closes modal      [AUTO] tests/search/globalSearch.spec.ts SEARCH-012
├── Reopening the modal resets query + view         [AUTO] tests/search/globalSearch.spec.ts SEARCH-013
├── Clear button restores the empty-state view      [AUTO] tests/search/globalSearch.spec.ts SEARCH-020
├── No-results state + Reset Search                 [AUTO] tests/search/globalSearch.spec.ts SEARCH-021
├── Search API failure → error state + retry        [AUTO] tests/search/globalSearch.spec.ts SEARCH-022
├── Guest empty-state carousels (no Continue watch) [AUTO] tests/search/globalSearch.spec.ts SEARCH-030
├── Whitespace-only query fires no search call      [AUTO] tests/search/globalSearch.spec.ts SEARCH-040
├── Single-character query searches (no min gate)   [AUTO] tests/search/globalSearch.spec.ts SEARCH-041
├── Special-char/XSS query handled safely           [AUTO] tests/search/globalSearch.spec.ts SEARCH-042
├── Debounce collapses rapid typing to one call     [AUTO] tests/search/globalSearch.spec.ts SEARCH-043
├── Query retained across tab switches              [AUTO] tests/search/globalSearch.spec.ts SEARCH-045
├── Opening search pauses video; closing resumes    [AUTO] tests/search/globalSearch.spec.ts SEARCH-050
├── Channels search by display name                 [TODO] (fixture name==handle; low value)  SEARCH-007
├── Logged-in empty-state: Continue watching row    [TODO] (needs seeded watch history)       SEARCH-031
└── Stale-response race safety (latest wins)        [TODO] (P3, interception-heavy)           SEARCH-044

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
│   Dashboard, Content, Analytics, Playlists, Edit channel, Settings, Send Feedback
├── Main sidebar: no studio items for logged user   [TODO]                                   STUDIO-DOMAIN-002
│   Home, Subscription, Library, History, Continue Watching, My playlists, Watch Later, Liked Videos
├── Studio sidebar: hidden for anonymous user       [TODO]                                   STUDIO-DOMAIN-003
├── Anonymous user on studio domain → redirect to main  [TODO]                               STUDIO-DOMAIN-004
├── Upload button on main → redirect to studio      [TODO]                                   STUDIO-DOMAIN-005
├── Search bar hidden on studio domain              [TODO]                                   STUDIO-DOMAIN-006
├── Edit channel click → popup (Cancel/OK) to main  [TODO]                                   STUDIO-DOMAIN-007
├── Non-studio pages on studio → redirect to main   [TODO]                                   STUDIO-DOMAIN-008
├── Studio notifications: filtered types only       [TODO]                                   STUDIO-DOMAIN-009
│   channel_subscription, comment_reply, ai_metadata_failed, ai_metadata_success
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
├── Desktop: video + channel + short page (anon/user/owner)    [AUTO] tests/visual/desktop/videoChannelVisual.spec.ts VIS-VCH-001..008
├── Desktop: watch-page layout Movie vs Series (эпизод-строка) [AUTO] tests/visual/desktop/videoChannelVisual.spec.ts VIS-VCH-009..010
├── Desktop: listing dropdowns movies/series/shorts            [AUTO] tests/visual/desktop/listingVisual.spec.ts     VIS-LIST-001..003
├── Mobile: header / dropdown / auth modal                     [AUTO] tests/visual/mobile/aitvVisual.spec.ts         VIS-AITV-MOB-003..006
├── Mobile: video page + channel page (anon/user/owner)        [AUTO] tests/visual/mobile/videoChannelVisual.spec.ts VIS-MOB-001..005
├── Mobile: watch-page layout Movie vs Series (эпизод-строка)  [AUTO] tests/visual/mobile/videoChannelVisual.spec.ts VIS-MOB-006..007
└── Mobile: listing dropdowns movies/series/shorts             [AUTO] tests/visual/mobile/listingVisual.spec.ts      VIS-LIST-MOB-001..003
