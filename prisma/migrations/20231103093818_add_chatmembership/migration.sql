-- CreateTable
CREATE TABLE "ChatMembership" (
    "chatRoomId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "ChatMembership_pkey" PRIMARY KEY ("chatRoomId","userId")
);

-- AddForeignKey
ALTER TABLE "ChatMembership" ADD CONSTRAINT "ChatMembership_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMembership" ADD CONSTRAINT "ChatMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
