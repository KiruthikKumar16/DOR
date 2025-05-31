-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "weight" INTEGER;

-- AddForeignKey
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
