import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rdpPlans = [
  { name: "RDP 1 CORE RAM 2 GB", base7d: 16250, spec: "1 Core, 2 GB RAM, 50 GB Disk" },
  { name: "RDP 2 CORE RAM 4 GB", base7d: 22750, spec: "2 Core, 4 GB RAM, 50 GB Disk" },
  { name: "RDP 4 CORE RAM 8 GB", base7d: 35750, spec: "4 Core, 8 GB RAM, 50 GB Disk" },
  { name: "RDP 6 CORE RAM 16 GB", base7d: 52000, spec: "6 Core, 16 GB RAM, 50 GB Disk" },
  { name: "RDP 8 CORE RAM 16 GB", base7d: 58500, spec: "8 Core, 16 GB RAM, 100 GB Disk" },
  { name: "RDP 10 CORE RAM 16 GB", base7d: 71500, spec: "10 Core, 16 GB RAM, 100 GB Disk" },
  { name: "RDP 8 CORE RAM 32 GB", base7d: 84500, spec: "8 Core, 32 GB RAM, 100 GB Disk" },
  { name: "RDP 16 CORE RAM 32 GB", base7d: 104000, spec: "16 Core, 32 GB RAM, 100 GB Disk" },
  { name: "RDP 16 CORE RAM 64 GB", base7d: 169000, spec: "16 Core, 64 GB RAM, 100 GB Disk" },
  { name: "RDP 10 CORE RAM 32 GB", base7d: 175000, spec: "10 Core, 32 GB RAM, 100 GB Disk" },
  { name: "RDP 32 CORE RAM 64 GB", base7d: 201500, spec: "32 Core, 64 GB RAM, 100 GB Disk" },
  { name: "RDP 32 CORE RAM 128 GB", base7d: 357500, spec: "32 Core, 128 GB RAM, 100 GB Disk" }
];

const osOptions = [
  "Windows Server 2012", "Windows Server 2016", "Windows Server 2019", 
  "Windows Server 2022", "Windows 10", "Ubuntu 22.04", "Debian 12"
];

const durationOptions = [
  { label: "7 Hari", months: 0.25, priceMultiplier: 1.0 },
  { label: "14 Hari", months: 0.5, priceMultiplier: 1.56 },
  { label: "21 Hari", months: 0.75, priceMultiplier: 1.88 },
  { label: "30 Hari", months: 1.0, priceMultiplier: 2.03 }
];

async function main() {
  console.log('🚀 Memulai re-impor produk RDP dengan metode UPSERT...');

  const vpsCategory = await prisma.category.findUnique({ where: { slug: 'vps-rdp' } });
  if (!vpsCategory) {
    console.error('❌ Kategori vps-rdp tidak ditemukan.');
    return;
  }

  for (const plan of rdpPlans) {
    const priceUser = Math.ceil(plan.base7d * 1.20);
    const priceReseller = Math.ceil(plan.base7d * 1.10);
    const slug = plan.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '') + '-starter';

    await prisma.product.upsert({
      where: { slug: slug },
      update: {
        name: plan.name + " STARTER PLAN",
        description: `Spesifikasi: ${plan.spec}. Garansi Full Durasi.`,
        priceUser,
        priceReseller,
        durationOptions: JSON.stringify(durationOptions),
        osOptions: JSON.stringify(osOptions),
        categoryId: vpsCategory.id // Pastikan kategori benar
      },
      create: {
        categoryId: vpsCategory.id,
        name: plan.name + " STARTER PLAN",
        slug: slug,
        description: `Spesifikasi: ${plan.spec}. Garansi Full Durasi.`,
        priceUser,
        priceReseller,
        type: 'PREMIUM',
        durationOptions: JSON.stringify(durationOptions),
        osOptions: JSON.stringify(osOptions)
      }
    });

    console.log(`✅ Diproses: ${plan.name}`);
  }

  console.log('✨ Re-impor RDP selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
