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
  status?: string | null;
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
  messages?: Message[]; // contient uniquement le dernier message (take: 1 côté backend)
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
  isDeleted?: boolean;
  type?: "TEXT" | "SYSTEM";
  createdAt: string;
  updatedAt: string;
   reactions?: MessageReaction[];
   replyToId?: string | null;
  replyTo?: Message | null;
   clientKey?: string;
}
export interface MessageReaction {
  id?: string;
  messageId: string;
  userId: string;
  emoji: string;
  user?: User;
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
export interface PostLike {
  id: string;
  postId: string;
  userId: string;
  user?: User;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  author?: User;
  createdAt: string;
}

export interface Post {
  id: string;
  authorId: string;
  author?: User;
  content?: string | null;
  imageUrl?: string | null;
  likes: PostLike[];
  comments: PostComment[]; // ne contient que le dernier commentaire (take: 1 côté backend)
  _count?: { comments: number };
  createdAt: string;
}