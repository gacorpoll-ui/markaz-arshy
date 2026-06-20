import prisma from './db.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');

  // 1. Clean up database
  await prisma.balanceTransaction.deleteMany();
  await prisma.deposit.deleteMany();
  await prisma.order.deleteMany();
  await prisma.account.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Create Users
  const adminPassword = await bcrypt.hash('admin123', 10);
  const resellerPassword = await bcrypt.hash('reseller123', 10);
  const userPassword = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Admin FollowerStore',
      email: 'admin@followerstore.com',
      password: adminPassword,
      role: 'ADMIN',
      isVerified: true,
      balance: 1000000,
    },
  });

  const reseller = await prisma.user.create({
    data: {
      name: 'Reseller Partner',
      email: 'reseller@followerstore.com',
      password: resellerPassword,
      role: 'RESELLER',
      isVerified: true,
      balance: 500000,
    },
  });

  const normalUser = await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'user@followerstore.com',
      password: userPassword,
      role: 'USER',
      isVerified: true,
      balance: 100000,
    },
  });

  console.log('Users created:');
  console.log(`- Admin: ${admin.email}`);
  console.log(`- Reseller: ${reseller.email}`);
  console.log(`- User: ${normalUser.email}`);

  // 3. Create Categories
  const catSmm = await prisma.category.create({
    data: {
      name: 'SMM Services',
      slug: 'smm-services',
      type: 'SMM',
      order: 1,
    },
  });

  const catPremium = await prisma.category.create({
    data: {
      name: 'Akun Premium',
      slug: 'akun-premium',
      type: 'PREMIUM',
      order: 2,
    },
  });

  console.log('Categories created.');

  // 4. Create Products
  const prodIgFollowers = await prisma.product.create({
    data: {
      categoryId: catSmm.id,
      name: 'Instagram Followers Real Indonesia',
      slug: 'instagram-followers-real-indonesia',
      description: 'Layanan followers Instagram pasif bergaransi 30 hari. Kecepatan 1k-2k per hari.',
      priceUser: 25.0, // Per 1 follower (misal Rp 25.000 per 1000)
      priceReseller: 18.0,
      type: 'SMM',
      providerServiceId: '101',
      minOrder: 100,
      maxOrder: 10000,
      isActive: true,
    },
  });

  const prodTiktokLikes = await prisma.product.create({
    data: {
      categoryId: catSmm.id,
      name: 'TikTok Likes Global High Quality',
      slug: 'tiktok-likes-global-high-quality',
      description: 'Layanan likes video TikTok global. Instant start, no drop.',
      priceUser: 15.0,
      priceReseller: 10.0,
      type: 'SMM',
      providerServiceId: '202',
      minOrder: 50,
      maxOrder: 5000,
      isActive: true,
    },
  });

  const prodNetflix = await prisma.product.create({
    data: {
      categoryId: catPremium.id,
      name: 'Netflix Premium 1 Bulan (Sharing 1 Profile)',
      slug: 'netflix-premium-1-bulan-sharing',
      description: 'Nonton Netflix Ultra HD 4K 1 profile sharing. Garansi penuh 30 hari.',
      priceUser: 35000.0,
      priceReseller: 29000.0,
      type: 'PREMIUM',
      isActive: true,
    },
  });

  const prodSpotify = await prisma.product.create({
    data: {
      categoryId: catPremium.id,
      name: 'Spotify Premium 1 Bulan (Individual)',
      slug: 'spotify-premium-1-bulan-individual',
      description: 'Spotify Premium Individual. Akun baru / perpanjang di luar family plan.',
      priceUser: 18000.0,
      priceReseller: 14000.0,
      type: 'PREMIUM',
      isActive: true,
    },
  });

  const prodChatGpt = await prisma.product.create({
    data: {
      categoryId: catPremium.id,
      name: 'ChatGPT Plus Shared Profile (DALL-E 3 & GPT-4)',
      slug: 'chatgpt-plus-shared-profile',
      description: 'Akses ChatGPT Plus dengan GPT-4. Shared account, patungan hemat.',
      priceUser: 45000.0,
      priceReseller: 38000.0,
      type: 'PREMIUM',
      isActive: true,
    },
  });

  console.log('Products created.');

  // 5. Add Premium Accounts Stock
  await prisma.account.createMany({
    data: [
      {
        productId: prodNetflix.id,
        email: 'net1@store.com',
        password: 'passwordnet1',
        extraInfo: JSON.stringify({ Profile: 'Profile A', PIN: '1234' }),
        isSold: false,
      },
      {
        productId: prodNetflix.id,
        email: 'net2@store.com',
        password: 'passwordnet2',
        extraInfo: JSON.stringify({ Profile: 'Profile B', PIN: '5678' }),
        isSold: false,
      },
      {
        productId: prodNetflix.id,
        email: 'net3_sold@store.com',
        password: 'passwordnet3',
        extraInfo: JSON.stringify({ Profile: 'Profile C', PIN: '9012' }),
        isSold: true,
        soldToUserId: normalUser.id,
        soldAt: new Date(),
      },
      {
        productId: prodSpotify.id,
        email: 'spot1@store.com',
        password: 'passwordspot1',
        extraInfo: JSON.stringify({ PremiumType: 'Individual Account' }),
        isSold: false,
      },
      {
        productId: prodSpotify.id,
        email: 'spot2@store.com',
        password: 'passwordspot2',
        extraInfo: JSON.stringify({ PremiumType: 'Individual Account' }),
        isSold: false,
      },
      {
        productId: prodChatGpt.id,
        email: 'gpt1@store.com',
        password: 'passwordgpt1',
        extraInfo: JSON.stringify({ System: 'Shared Login via OAuth Link' }),
        isSold: false,
      },
    ],
  });

  console.log('Accounts stock created.');

  // 6. Create initial orders history
  await prisma.order.create({
    data: {
      userId: normalUser.id,
      productId: prodNetflix.id,
      type: 'PREMIUM',
      amount: 35000.0,
      status: 'COMPLETED',
      accountId: 3, // reference to the sold Netflix account
      notes: 'Pembelian pertama berhasil',
    },
  });

  console.log('Seed database finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
