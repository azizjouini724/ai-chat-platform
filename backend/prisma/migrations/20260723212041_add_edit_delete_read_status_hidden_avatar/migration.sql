-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "avatarUrl" TEXT;

-- AlterTable
ALTER TABLE "ConversationMember" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "lastReadAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isEdited" BOOLEAN NOT NULL DEFAULT false;
