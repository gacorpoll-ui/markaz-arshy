import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'klikbeli72@gmail.com';
  const password = 'Riri@150187';
  
  // Check if user already exists
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (user) {
    console.log(`User ${email} already exists. Updating role to ADMIN...`);
    user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });
    console.log('Role updated successfully.');
  } else {
    console.log(`User ${email} not found. Creating new ADMIN user...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await prisma.user.create({
      data: {
        name: 'Admin Markaz Arshy',
        email: email,
        password: hashedPassword,
        role: 'ADMIN',
        balance: 1000000 // Give admin some initial balance for testing
      }
    });
    console.log('Admin user created successfully.');
  }
}

createAdmin()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
