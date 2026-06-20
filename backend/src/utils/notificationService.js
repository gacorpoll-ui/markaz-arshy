import prisma from '../db.js';

export async function createNotification(userId, type, message, link = null) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                type,
                message,
                link,
            },
        });
        // console.log(`Notification created for user ${userId}: ${message}`);
    } catch (error) {
        console.error('Error creating notification:', error);
    }
}

// Optionally, add a function to send a system-wide notification (e.g., to all admins)
export async function createAdminNotification(type, message, link = null) {
    try {
        const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { id: true }
        });

        const notifications = admins.map(admin => ({
            userId: admin.id,
            type,
            message,
            link,
        }));

        if (notifications.length > 0) {
            await prisma.notification.createMany({
                data: notifications
            });
            // console.log(`Admin notification created: ${message}`);
        }
    } catch (error) {
        console.error('Error creating admin notification:', error);
    }
}
