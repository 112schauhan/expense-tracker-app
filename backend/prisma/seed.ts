import { PrismaClient, Role, ExpenseCategory, ExpenseStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Hash password for all users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: { email: 'admin@expensetracker.com' },
    update: {},
    create: {
      email: 'admin@expensetracker.com',
      name: 'Admin Manager',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create Employee Users
  const employees = await Promise.all([
    prisma.user.upsert({
      where: { email: 'john.doe@expensetracker.com' },
      update: {},
      create: {
        email: 'john.doe@expensetracker.com',
        name: 'John Doe',
        password: hashedPassword,
        role: Role.EMPLOYEE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'jane.smith@expensetracker.com' },
      update: {},
      create: {
        email: 'jane.smith@expensetracker.com',
        name: 'Jane Smith',
        password: hashedPassword,
        role: Role.EMPLOYEE,
      },
    }),
    prisma.user.upsert({
      where: { email: 'mike.johnson@expensetracker.com' },
      update: {},
      create: {
        email: 'mike.johnson@expensetracker.com',
        name: 'Mike Johnson',
        password: hashedPassword,
        role: Role.EMPLOYEE,
      },
    }),
  ]);

  console.log('✅ Employee users created:', employees.map(e => e.email));

  // Sample expense data
  const expenseData = [
    // John's expenses
    {
      amount: 25.50,
      category: ExpenseCategory.FOOD,
      description: 'Team lunch at downtown restaurant',
      date: new Date('2024-07-15'),
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
    },
    {
      amount: 45.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Uber to client meeting',
      date: new Date('2024-07-16'),
      status: ExpenseStatus.PENDING,
      userId: employees[0].id,
    },
    {
      amount: 120.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Monthly subscription for design tools',
      date: new Date('2024-07-10'),
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
    },
    {
      amount: 85.75,
      category: ExpenseCategory.OFFICE_SUPPLIES,
      description: 'Printer cartridges and paper',
      date: new Date('2024-07-05'),
      status: ExpenseStatus.REJECTED,
      rejectionReason: 'Please use company supplier for office supplies',
      userId: employees[0].id,
    },

    // Jane's expenses
    {
      amount: 75.00,
      category: ExpenseCategory.TRAINING,
      description: 'Online course certification',
      date: new Date('2024-07-18'),
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
    },
    {
      amount: 32.50,
      category: ExpenseCategory.FOOD,
      description: 'Client dinner',
      date: new Date('2024-07-19'),
      status: ExpenseStatus.PENDING,
      userId: employees[1].id,
    },
    {
      amount: 150.00,
      category: ExpenseCategory.MARKETING,
      description: 'Conference registration fee',
      date: new Date('2024-07-12'),
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
    },
    {
      amount: 28.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Parking fees for client visit',
      date: new Date('2024-07-14'),
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
    },

    // Mike's expenses
    {
      amount: 200.00,
      category: ExpenseCategory.ACCOMMODATION,
      description: 'Hotel for business trip',
      date: new Date('2024-07-20'),
      status: ExpenseStatus.PENDING,
      userId: employees[2].id,
    },
    {
      amount: 65.00,
      category: ExpenseCategory.ENTERTAINMENT,
      description: 'Team building dinner',
      date: new Date('2024-07-17'),
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
    },
    {
      amount: 90.00,
      category: ExpenseCategory.TRAVEL,
      description: 'Flight booking fee',
      date: new Date('2024-07-08'),
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
    },
    {
      amount: 15.50,
      category: ExpenseCategory.UTILITIES,
      description: 'Internet charges for home office',
      date: new Date('2024-07-11'),
      status: ExpenseStatus.PENDING,
      userId: employees[2].id,
    },

    // Admin's expenses
    {
      amount: 300.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Enterprise software license',
      date: new Date('2024-07-13'),
      status: ExpenseStatus.APPROVED,
      userId: admin.id,
    },
    {
      amount: 50.00,
      category: ExpenseCategory.OTHER,
      description: 'Miscellaneous office expenses',
      date: new Date('2024-07-09'),
      status: ExpenseStatus.APPROVED,
      userId: admin.id,
    },
  ];

  // Create expenses
  const createdExpenses = await prisma.expense.createMany({
    data: expenseData,
  });

  console.log(`✅ Created ${createdExpenses.count} sample expenses`);

  // Add some older expenses for analytics
  const olderExpenseData = [
    {
      amount: 180.00,
      category: ExpenseCategory.TRAINING,
      description: 'Workshop attendance',
      date: new Date('2024-06-15'),
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
    },
    {
      amount: 95.00,
      category: ExpenseCategory.FOOD,
      description: 'Client lunch meeting',
      date: new Date('2024-06-20'),
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
    },
    {
      amount: 250.00,
      category: ExpenseCategory.ACCOMMODATION,
      description: 'Conference hotel stay',
      date: new Date('2024-05-25'),
      status: ExpenseStatus.APPROVED,
      userId: employees[2].id,
    },
    {
      amount: 40.00,
      category: ExpenseCategory.TRANSPORT,
      description: 'Monthly metro pass',
      date: new Date('2024-06-01'),
      status: ExpenseStatus.APPROVED,
      userId: employees[0].id,
    },
    {
      amount: 110.00,
      category: ExpenseCategory.SOFTWARE,
      description: 'Development tools subscription',
      date: new Date('2024-05-15'),
      status: ExpenseStatus.APPROVED,
      userId: employees[1].id,
    },
  ];

  const olderExpenses = await prisma.expense.createMany({
    data: olderExpenseData,
  });

  console.log(`✅ Created ${olderExpenses.count} historical expenses for analytics`);

  // Summary
  const totalUsers = await prisma.user.count();
  const totalExpenses = await prisma.expense.count();
  const totalAmount = await prisma.expense.aggregate({
    _sum: { amount: true },
  });

  console.log('\n📊 Seeding Summary:');
  console.log(`👥 Total Users: ${totalUsers}`);
  console.log(`💰 Total Expenses: ${totalExpenses}`);
  console.log(`💵 Total Amount: $${totalAmount._sum.amount?.toFixed(2) || '0.00'}`);
  console.log('\n🔐 Test Credentials:');
  console.log('Admin: admin@expensetracker.com / password123');
  console.log('Employee 1: john.doe@expensetracker.com / password123');
  console.log('Employee 2: jane.smith@expensetracker.com / password123');
  console.log('Employee 3: mike.johnson@expensetracker.com / password123');
  console.log('\n🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });