import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  const args = process.argv.slice(2);
  const nombre = args[0];
  const email = args[1];
  const password = args[2];

  if (!nombre || !email || !password) {
    console.log("Uso: npx ts-node scripts/crear-usuario.ts <nombre> <email> <contraseña>");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name: nombre, password: hash },
    create: { name: nombre, email, password: hash },
  });

  console.log(`✅ Usuario creado/actualizado: ${user.name} (${user.email})`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
