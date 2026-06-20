import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const shineProducts = [
  {
    "name": "RDP 1 CORE RAM 2 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 16250,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "1 Core", "ram": "2 GB", "storage": "50 GB" }
  },
  {
    "name": "RDP 2 CORE RAM 4 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 22750,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "2 Core", "ram": "4 GB", "storage": "50 GB" }
  },
  {
    "name": "RDP 4 CORE RAM 8 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 35750,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "4 Core", "ram": "8 GB", "storage": "50 GB" }
  },
  {
    "name": "RDP 6 CORE RAM 16 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 52000,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "6 Core", "ram": "16 GB", "storage": "50 GB" }
  },
  {
    "name": "RDP 8 CORE RAM 16 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 58500,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "8 Core", "ram": "16 GB", "storage": "100 GB" }
  },
  {
    "name": "RDP 10 CORE RAM 16 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 71500,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "10 Core", "ram": "16 GB", "storage": "100 GB" }
  },
  {
    "name": "RDP 8 CORE RAM 32 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 84500,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "8 Core", "ram": "32 GB", "storage": "100 GB" }
  },
  {
    "name": "RDP 16 CORE RAM 32 GB STARTER PLAN",
    "category": "VPS/RDP",
    "base_price": 104000,
    "duration_options": [{ "label": "7 Hari", "months": 0.25, "priceMultiplier": 1 }],
    "os_options": ["Windows Server 2012", "Windows Server 2016", "Windows Server 2019", "Windows Server 2022", "Windows 10"],
    "specifications": { "core": "16 Core", "ram": "32 GB", "storage": "100 GB" }
  }
];

async function main() {
  console.log('🚀 Memulai impor produk Shine Server...');

  // 1. Pastikan kategori ada
  const vpsCategory = await prisma.category.upsert({
    where: { slug: 'vps-rdp' },
    update: {},
    create: {
      name: 'VPS/RDP',
      slug: 'vps-rdp',
      type: 'PREMIUM'
    }
  });

  const premiumCategory = await prisma.category.upsert({
    where: { slug: 'premium-accounts' },
    update: {},
    create: {
      name: 'Akun Premium',
      slug: 'premium-accounts',
      type: 'PREMIUM'
    }
  });

  // 2. Impor Produk
  for (const item of shineProducts) {
    // Hitung Markup
    const priceUser = Math.ceil(item.base_price * 1.20); // +20% Member
    const priceReseller = Math.ceil(item.base_price * 1.10); // +10% Reseller

    const slug = item.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await prisma.product.upsert({
      where: { slug: slug },
      update: {
        priceUser,
        priceReseller,
        durationOptions: JSON.stringify(item.duration_options),
        osOptions: JSON.stringify(item.os_options)
      },
      create: {
        categoryId: vpsCategory.id,
        name: item.name,
        slug: slug,
        description: `Spesifikasi: ${item.specifications.core}, RAM ${item.specifications.ram}, Disk ${item.specifications.storage}`,
        priceUser,
        priceReseller,
        type: 'PREMIUM',
        durationOptions: JSON.stringify(item.duration_options),
        osOptions: JSON.stringify(item.os_options)
      }
    });

    console.log(`✅ Diimpor: ${item.name} (Member: Rp ${priceUser}, Reseller: Rp ${priceReseller})`);
  }

  console.log('✨ Impor selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
