export const FriendshipStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type FriendshipStatus = (typeof FriendshipStatus)[keyof typeof FriendshipStatus];

export const ConversationType = {
  PRIVATE: "PRIVATE",
  GROUP: "GROUP",
} as const;
export type ConversationType = (typeof ConversationType)[keyof typeof ConversationType];

export const MemberRole = {
  MEMBER: "MEMBER",
  ADMIN: "ADMIN",
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const JoinRequestStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
export type JoinRequestStatus = (typeof JoinRequestStatus)[keyof typeof JoinRequestStatus];

export const MessageType = {
  TEXT: "TEXT",
  IMAGE: "IMAGE",
  DOCUMENT: "DOCUMENT",
} as const;
export type MessageType = (typeof MessageType)[keyof typeof MessageType];