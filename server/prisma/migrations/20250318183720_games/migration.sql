-- CreateTable
CREATE TABLE "Games" (
    "id" SERIAL NOT NULL,
    "userID" INTEGER NOT NULL,
    "gameID" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "white" TEXT NOT NULL,
    "black" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "moves" TEXT NOT NULL,
    "winner" TEXT NOT NULL,

    CONSTRAINT "Games_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
