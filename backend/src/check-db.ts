import { prisma } from "./config/database";

async function main() {
  console.log("Checking teachers in database...");
  const teachers = await prisma.teacher.findMany();
  console.log("Total teachers:", teachers.length);
  teachers.forEach(t => {
    console.log(`- ID: ${t.id}, Name: ${t.fullName}, Email: ${t.email}, Verified: ${t.isVerified}`);
  });
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
