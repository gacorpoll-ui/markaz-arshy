import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.paymentMethod.createMany({
    data: [
      {
        name: "Bank BCA",
        accountName: "PT Markaz Arshy",
        accountNumber: "1234567890",
        instructions: "Harap transfer tepat hingga 3 digit terakhir. Bukti transfer wajib diunggah."
      },
      {
        name: "DANA",
        accountName: "Markaz Arshy",
        accountNumber: "081234567890",
        instructions: "Transfer DANA bebas admin. Wajib screenshot bukti transfer yang berhasil."
      },
      {
        name: "GoPay",
        accountName: "Markaz Arshy",
        accountNumber: "081234567890",
        instructions: "Transfer ke GoPay. Wajib upload bukti transfer."
      },
      {
        name: "QRIS",
        accountName: "Markaz Arshy",
        accountNumber: "SCAN_QR",
        instructions: "Silakan hubungi Admin untuk meminta gambar QRIS jika diperlukan, lalu upload buktinya di sini."
      }
    ]
  });
  console.log("Payment methods seeded!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
