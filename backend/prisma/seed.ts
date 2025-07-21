import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN'
    }
  });

  const employee = await prisma.user.upsert({
    where: { email: 'employee@demo.com' },
    update: {},
    create: {
      email: 'employee@demo.com',
      password: hashedPassword,
      name: 'John Employee',
      role: 'EMPLOYEE'
    }
  });

  const categories = ['Travel', 'Meals', 'Office Supplies', 'Software', 'Training'];
  const statuses = ['PENDING', 'APPROVED', 'REJECTED'] as const;

  for (let i = 0; i < 20; i++) {
    await prisma.expense.create({
      data: {
        amount: Math.floor(Math.random() * 500) + 10,
        category: categories[Math.floor(Math.random() * categories.length)],
        description: `Sample expense ${i + 1}`,
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        status: statuses[Math.floor(Math.random() * statuses.length)],
        userId: Math.random() > 0.3 ? employee.id : admin.id
      }
    });
  }

  console.log('Seeding completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });