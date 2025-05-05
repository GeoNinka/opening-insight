-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "upadted_at" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Games" (
    "id" SERIAL NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
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

-- CreateTable
CREATE TABLE "Theory" (
    "id" SERIAL NOT NULL,
    "fen" TEXT NOT NULL,
    "pgn" TEXT NOT NULL,
    "positionName" TEXT NOT NULL,
    "positionDescription" TEXT NOT NULL,
    "circles" JSONB NOT NULL,
    "arrows" JSONB NOT NULL,

    CONSTRAINT "Theory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theoreticalContinuations" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    CONSTRAINT "theoreticalContinuations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "theoreticalBlunders" (
    "id" SERIAL NOT NULL,
    "fromId" INTEGER NOT NULL,
    "toId" INTEGER NOT NULL,

    CONSTRAINT "theoreticalBlunders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Theory_fen_key" ON "Theory"("fen");

-- AddForeignKey
ALTER TABLE "Games" ADD CONSTRAINT "Games_userID_fkey" FOREIGN KEY ("userID") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoreticalContinuations" ADD CONSTRAINT "theoreticalContinuations_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Theory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoreticalContinuations" ADD CONSTRAINT "theoreticalContinuations_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Theory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoreticalBlunders" ADD CONSTRAINT "theoreticalBlunders_fromId_fkey" FOREIGN KEY ("fromId") REFERENCES "Theory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "theoreticalBlunders" ADD CONSTRAINT "theoreticalBlunders_toId_fkey" FOREIGN KEY ("toId") REFERENCES "Theory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
