import type { ConversationType, FriendshipStatus, JoinRequestStatus, MemberRole } from "./enums";

export interface User {
  id: string;
  email: string;
  username: string;
  bio?: string | null;
  avatarUrl?: string | null;
  isOnline?: boolean;
  lastSeenAt?: string | null;
  createdAt: string;
}

export interface Friendship {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendshipStatus;
  sender?: User;
  receiver?: User;
  createdAt: string;
}

export interface Block {
  id: string;
  blockerId: string;
  blockedId: string;
  blocked?: User;
  createdAt: string;
}

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: MemberRole;
  user?: User;
  joinedAt: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name?: string | null;
  avatarUrl?: string | null;
  members: ConversationMember[];
  lastMessage?: Message | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  content?: string | null;
  imageUrl?: string | null;
  documentUrl?: string | null;
  isEdited?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GroupJoinRequest {
  id: string;
  conversationId: string;
  userId: string;
  user?: User;
  status: JoinRequestStatus;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user?: User;
}