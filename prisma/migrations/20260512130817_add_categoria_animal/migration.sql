-- CreateEnum
CREATE TYPE "CategoriaAnimal" AS ENUM ('VACA_MADRE', 'VAQUILLONA', 'TERNERO', 'TERNERA', 'TORO', 'NOVILLO');

-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "categoria" "CategoriaAnimal";

-- CreateTable
CREATE TABLE "ConteoManual" (
    "id" TEXT NOT NULL,
    "categoria" "CategoriaAnimal" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConteoManual_pkey" PRIMARY KEY ("id")
);
