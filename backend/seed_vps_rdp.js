import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const prisma = new PrismaClient();

async function seedVPS() {
  console.log("Menambahkan Layanan VPS dan RDP...");
  
  try {
    // 1. Buat Kategori VPS & RDP
    let category = await prisma.category.findUnique({ where: { slug: 'vps-rdp-premium' } });
    
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "VPS & RDP Premium",
          slug: "vps-rdp-premium",
          type: "PREMIUM",
          order: 1 // Muncul di atas SMM
        }
      });
      console.log(`Berhasil membuat kategori: ${category.name}`);
    } else {
      console.log(`Kategori ${category.name} sudah ada.`);
    }

    // 2. Daftar Produk VPS & RDP
    const products = [
      {
        name: "Windows RDP Admin (4GB RAM, 2 vCPU)",
        slug: "windows-rdp-4gb",
        description: "RDP Windows Full Administrator. Cocok untuk botting, trading, atau server ringan. Aktif 30 Hari.",
        priceUser: 85000,
        priceReseller: 70000,
        type: "PREMIUM"
      },
      {
        name: "Windows RDP High-End (8GB RAM, 4 vCPU)",
        slug: "windows-rdp-8gb",
        description: "RDP Windows super kencang. Bisa untuk OBS, rendering ringan, atau server game. Aktif 30 Hari.",
        priceUser: 150000,
        priceReseller: 120000,
        type: "PREMIUM"
      },
      {
        name: "Linux VPS Ubuntu 22.04 (2GB RAM)",
        slug: "linux-vps-2gb",
        description: "VPS Linux dengan akses Root penuh. Cocok untuk web server, bot telegram/discord, atau VPN. Aktif 30 Hari.",
        priceUser: 50000,
        priceReseller: 40000,
        type: "PREMIUM"
      }
    ];

    // 3. Masukkan produk ke database
    for (const prod of products) {
      let product = await prisma.product.findUnique({ where: { slug: prod.slug } });
      
      if (!product) {
        product = await prisma.product.create({
          data: {
            categoryId: category.id,
            name: prod.name,
            slug: prod.slug,
            description: prod.description,
            priceUser: prod.priceUser,
            priceReseller: prod.priceReseller,
            type: prod.type,
            isActive: true,
            minOrder: 1,
            maxOrder: 1 // Akun premium hanya bisa dibeli 1 per 1 di aplikasi ini
          }
        });
        console.log(`Dibuat Produk: ${product.name}`);
        
        // 4. Tambahkan 2 stok (Account Dummy) untuk setiap produk baru
        await prisma.account.createMany({
          data: [
            {
              productId: product.id,
              email: "IP: 192.168.1.100",
              password: "passwordRahas!a",
              extraInfo: "User: Administrator. Dilarang menggunakannya untuk hal ilegal.",
              isSold: false
            },
            {
              productId: product.id,
              email: "IP: 192.168.1.101",
              password: "passwordRahasi4",
              extraInfo: "User: Administrator. VPS Fresh baru install.",
              isSold: false
            }
          ]
        });
        console.log(`  -> Ditambahkan 2 stok dummy untuk ${product.name}`);
      } else {
        console.log(`Produk ${product.name} sudah ada.`);
      }
    }
    
    console.log("Penambahan Layanan VPS/RDP Selesai!");

  } catch (err) {
    console.error("Gagal menambahkan VPS:", err);
  } finally {
    await prisma.$disconnect();
  }
}

seedVPS();
