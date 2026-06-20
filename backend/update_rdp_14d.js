import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const rdpPlans14d = [
  { name: "RDP 1 CORE RAM 2 GB 14D", base14d: 25350, spec: "1 Core, 2 GB RAM, 50 GB Disk, 14 Hari" },
  { name: "RDP 2 CORE RAM 4 GB 14D", base14d: 35490, spec: "2 Core, 4 GB RAM, 50 GB Disk, 14 Hari" },
  { name: "RDP 4 CORE RAM 8 GB 14D", base14d: 55770, spec: "4 Core, 8 GB RAM, 50 GB Disk, 14 Hari" },
  { name: "RDP 6 CORE RAM 16 GB 14D", base14d: 81120, spec: "6 Core, 16 GB RAM, 50 GB Disk, 14 Hari" },
  { name: "RDP 8 CORE RAM 16 GB 14D", base14d: 91260, spec: "8 Core, 16 GB RAM, 100 GB Disk, 14 Hari" },
  { name: "RDP 10 CORE RAM 16 GB 14D", base14d: 111540, spec: "10 Core, 16 GB RAM, 100 GB Disk, 14 Hari" }
];

const osOptions = [
  "Windows Server 2012", "Windows Server 2016", "Windows Server 2019", 
  "Windows Server 2022", "Windows 10", "Ubuntu 22.04", "Debian 12"
];

async function main() {
  console.log('🧹 Menghapus produk lama sesuai permintaan...');
  
  const slugsToDelete = [
    'linux-vps-ubuntu-2204-2gb-ram',
    'windows-rdp-high-end-8gb-ram-4-vcpu',
    'windows-rdp-admin-4gb-ram-2-vcpu'
  ];

  for (const slug of slugsToDelete) {
    try {
      const deleted = await prisma.product.delete({ where: { slug } });
      console.log(`✅ Dihapus: ${deleted.name}`);
    } catch (e) {
      console.log(`⚠️ Skip hapus ${slug}: Produk tidak ditemukan atau memiliki order.`);
    }
  }

  console.log('\n🚀 Memulai impor produk RDP 14 Hari dari Shine Server...');

  const vpsCategory = await prisma.category.findUnique({ where: { slug: 'vps-rdp' } });
  if (!vpsCategory) {
    console.error('❌ Kategori vps-rdp tidak ditemukan.');
    return;
  }

  for (const plan of rdpPlans14d) {
    const priceUser = Math.ceil(plan.base14d * 1.20);
    const priceReseller = Math.ceil(plan.base14d * 1.10);
    const slug = plan.name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    await prisma.product.upsert({
      where: { slug: slug },
      update: {
        name: plan.name,
        description: `Spesifikasi: ${plan.spec}. Garansi Full Durasi 14 Hari.`,
        priceUser,
        priceReseller,
        categoryId: vpsCategory.id,
        durationOptions: JSON.stringify([{ label: "14 Hari", months: 0.5, priceMultiplier: 1.0 }]),
        osOptions: JSON.stringify(osOptions)
      },
      create: {
        categoryId: vpsCategory.id,
        name: plan.name,
        slug: slug,
        description: `Spesifikasi: ${plan.spec}. Garansi Full Durasi 14 Hari.`,
        priceUser,
        priceReseller,
        type: 'PREMIUM',
        durationOptions: JSON.stringify([{ label: "14 Hari", months: 0.5, priceMultiplier: 1.0 }]),
        osOptions: JSON.stringify(osOptions)
      }
    });

    console.log(`✅ Diproses: ${plan.name} (Member: Rp ${priceUser})`);
  }

  console.log('✨ Selesai!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
