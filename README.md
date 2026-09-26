[README.md.pdf](https://github.com/user-attachments/files/29891105/README.md.pdf)

```
chat_app
├─ backend
│  ├─ .prettierrc
│  ├─ eslint.config.mjs
│  ├─ nest-cli.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ prisma
│  │  ├─ migrations
│  │  │  ├─ 20260709162743_init
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260710132226_add_refresh_token
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260711170850_add_profile_fields
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260712131556_add_friendship
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260712135802_add_cascade_delete
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260712140348_add_block_system
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260715141329_add_email_verification_reset_password
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260716134547_add_decline_count
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260718160246_add_messaging
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260719132216_add_group_admin_join_requests
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260719133215_fix_group_join_request_logic
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260723212041_add_edit_delete_read_status_hidden_avatar
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260727212313_add_online_status
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260811230328_add_message_hide
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260908203059_add_message_type
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260916105428_add_message_reactions
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260916202418_add_message_reply
│  │  │  │  └─ migration.sql
│  │  │  ├─ 20260921200509_add_posts_and_status
│  │  │  │  └─ migration.sql
│  │  │  └─ migration_lock.toml
│  │  └─ schema.prisma
│  ├─ prisma.config.ts
│  ├─ README.md
│  ├─ src
│  │  ├─ app.controller.spec.ts
│  │  ├─ app.controller.ts
│  │  ├─ app.module.ts
│  │  ├─ app.service.ts
│  │  ├─ auth
│  │  │  ├─ auth.controller.spec.ts
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ auth.module.ts
│  │  │  ├─ auth.service.spec.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ dto
│  │  │  │  ├─ forgot-password.dto.ts
│  │  │  │  ├─ login.dto.ts
│  │  │  │  ├─ register.dto.ts
│  │  │  │  └─ reset-password.dto.ts
│  │  │  ├─ guards
│  │  │  │  ├─ jwt-auth.guard.ts
│  │  │  │  └─ refresh.guard.ts
│  │  │  └─ strategies
│  │  │     ├─ jwt.strategy.ts
│  │  │     └─ refresh.strategy.ts
│  │  ├─ cloudinary
│  │  │  ├─ cloudinary.module.ts
│  │  │  ├─ cloudinary.service.spec.ts
│  │  │  └─ cloudinary.service.ts
│  │  ├─ common
│  │  │  └─ all-exceptions.filter.ts
│  │  ├─ conversations
│  │  │  ├─ conversations.controller.spec.ts
│  │  │  ├─ conversations.controller.ts
│  │  │  ├─ conversations.module.ts
│  │  │  ├─ conversations.service.spec.ts
│  │  │  ├─ conversations.service.ts
│  │  │  └─ dto
│  │  │     └─ create-group.dto.ts
│  │  ├─ friends
│  │  │  ├─ friends.controller.spec.ts
│  │  │  ├─ friends.controller.ts
│  │  │  ├─ friends.module.ts
│  │  │  ├─ friends.service.spec.ts
│  │  │  └─ friends.service.ts
│  │  ├─ mail
│  │  │  ├─ mail.module.ts
│  │  │  ├─ mail.service.spec.ts
│  │  │  └─ mail.service.ts
│  │  ├─ main.ts
│  │  ├─ messages
│  │  │  ├─ dto
│  │  │  │  ├─ create-message.dto.ts
│  │  │  │  └─ set-reaction.dto.ts
│  │  │  ├─ messages.controller.spec.ts
│  │  │  ├─ messages.controller.ts
│  │  │  ├─ messages.module.ts
│  │  │  ├─ messages.service.spec.ts
│  │  │  └─ messages.service.ts
│  │  ├─ posts
│  │  │  ├─ posts.controller.spec.ts
│  │  │  ├─ posts.controller.ts
│  │  │  ├─ posts.module.ts
│  │  │  ├─ posts.service.spec.ts
│  │  │  └─ posts.service.ts
│  │  ├─ prisma
│  │  │  ├─ prisma.module.ts
│  │  │  ├─ prisma.service.spec.ts
│  │  │  └─ prisma.service.ts
│  │  ├─ users
│  │  │  ├─ dto
│  │  │  │  └─ update-user.dto.ts
│  │  │  ├─ users.controller.spec.ts
│  │  │  ├─ users.controller.ts
│  │  │  ├─ users.module.ts
│  │  │  ├─ users.service.spec.ts
│  │  │  └─ users.service.ts
│  │  └─ websocket
│  │     ├─ websocket.gateway.spec.ts
│  │     ├─ websocket.gateway.ts
│  │     ├─ websocket.module.ts
│  │     ├─ websocket.service.spec.ts
│  │     └─ websocket.service.ts
│  ├─ test
│  │  ├─ app.e2e-spec.ts
│  │  └─ jest-e2e.json
│  ├─ tsconfig.build.json
│  └─ tsconfig.json
├─ chatinii.png
├─ design projet.zip
├─ frontend
│  ├─ components.json
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  ├─ favicon.svg
│  │  └─ icons.svg
│  ├─ README.md
│  ├─ src
│  │  ├─ api
│  │  │  ├─ auth.api.ts
│  │  │  ├─ conversations.api.ts
│  │  │  ├─ friends.api.ts
│  │  │  ├─ messages.api.ts
│  │  │  ├─ posts.api.ts
│  │  │  └─ users.api.ts
│  │  ├─ App.css
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  └─ logo.png
│  │  ├─ components
│  │  │  ├─ ErrorBoundary.tsx
│  │  │  ├─ layout
│  │  │  │  ├─ Sidebar.tsx
│  │  │  │  └─ Topbar.tsx
│  │  │  ├─ mode-toggle.tsx
│  │  │  ├─ shared
│  │  │  │  ├─ PasswordInput.tsx
│  │  │  │  ├─ UserAvatar.tsx
│  │  │  │  └─ UserProfileDialog.tsx
│  │  │  ├─ theme-provider.tsx
│  │  │  └─ ui
│  │  │     ├─ avatar.tsx
│  │  │     ├─ badge.tsx
│  │  │     ├─ button.tsx
│  │  │     ├─ card.tsx
│  │  │     ├─ checkbox.tsx
│  │  │     ├─ dialog.tsx
│  │  │     ├─ dropdown-menu.tsx
│  │  │     ├─ form.tsx
│  │  │     ├─ input.tsx
│  │  │     ├─ label.tsx
│  │  │     ├─ scroll-area.tsx
│  │  │     ├─ separator.tsx
│  │  │     ├─ skeleton.tsx
│  │  │     ├─ tabs.tsx
│  │  │     └─ tooltip.tsx
│  │  ├─ hooks
│  │  │  └─ useSocketConnection.ts
│  │  ├─ index.css
│  │  ├─ layouts
│  │  │  ├─ AppLayout.tsx
│  │  │  └─ AuthLayout.tsx
│  │  ├─ lib
│  │  │  ├─ axios.ts
│  │  │  ├─ conversation-utils.ts
│  │  │  ├─ date-separator.ts
│  │  │  ├─ download-file.ts
│  │  │  ├─ error-message.ts
│  │  │  ├─ notification-sound.ts
│  │  │  ├─ reactions.ts
│  │  │  ├─ relative-time.ts
│  │  │  ├─ utils.ts
│  │  │  └─ validation
│  │  │     └─ auth.schemas.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ auth
│  │  │  │  ├─ AuthFlow.tsx
│  │  │  │  ├─ ForgotPasswordPage.tsx
│  │  │  │  ├─ LoginPage.tsx
│  │  │  │  ├─ RegisterPage.tsx
│  │  │  │  └─ ResetPasswordPage.tsx
│  │  │  ├─ contacts
│  │  │  │  ├─ components
│  │  │  │  │  ├─ DiscoverCard.tsx
│  │  │  │  │  ├─ DiscoverDialog.tsx
│  │  │  │  │  ├─ FriendCard.tsx
│  │  │  │  │  └─ FriendRequestCard.tsx
│  │  │  │  └─ ContactsPage.tsx
│  │  │  ├─ messages
│  │  │  │  ├─ components
│  │  │  │  │  ├─ AddGroupMemberDialog.tsx
│  │  │  │  │  ├─ ChatWindow.tsx
│  │  │  │  │  ├─ ConversationHeader.tsx
│  │  │  │  │  ├─ ConversationList.tsx
│  │  │  │  │  ├─ ConversationListItem.tsx
│  │  │  │  │  ├─ ConversationListSkeleton.tsx
│  │  │  │  │  ├─ ConversationSearch.tsx
│  │  │  │  │  ├─ CreateGroupDialog.tsx
│  │  │  │  │  ├─ EmptyConversation.tsx
│  │  │  │  │  ├─ GroupInfoDialog.tsx
│  │  │  │  │  ├─ MessageBubble.tsx
│  │  │  │  │  ├─ MessageInput.tsx
│  │  │  │  │  ├─ MessageReactions.tsx
│  │  │  │  │  ├─ QuotedMessage.tsx
│  │  │  │  │  ├─ ReactionPicker.tsx
│  │  │  │  │  └─ ReplyPreview.tsx
│  │  │  │  └─ MessagesPage.tsx
│  │  │  └─ profile
│  │  │     ├─ components
│  │  │     │  ├─ CreatePostForm.tsx
│  │  │     │  ├─ PostCard.tsx
│  │  │     │  └─ PostComments.tsx
│  │  │     ├─ MyProfilePage.tsx
│  │  │     └─ OtherUserProfilePage.tsx
│  │  ├─ sockets
│  │  │  └─ socket.ts
│  │  ├─ store
│  │  │  ├─ auth.store.ts
│  │  │  ├─ conversations.store.ts
│  │  │  ├─ notification-preferences.store.ts
│  │  │  ├─ presence.store.ts
│  │  │  └─ profile-navigation.store.ts
│  │  └─ types
│  │     ├─ enums.ts
│  │     └─ models.ts
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  └─ vite.config.ts
├─ logo app.png
├─ logoo1111.png
├─ logoooo.png
├─ page friend request .png
├─ page message.png
├─ pages contacts .png
├─ pages ia tools.png
├─ palette de couleur.png
├─ README.md
├─ README.md.pdf
└─ Test websocket .html

```