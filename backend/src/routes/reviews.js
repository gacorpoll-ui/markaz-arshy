import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const prisma = new PrismaClient();
const router = Router();

// 1. Submit a new review (User)
router.post('/', requireAuth, async (req, res) => {
  const { productId, rating, comment } = req.body;
  const userId = req.user.id; // From authenticateToken middleware

  // Basic validation
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
  }

  try {
    // Check if user has purchased the product (optional, but good practice)
    const hasPurchased = await prisma.order.count({
      where: {
        userId,
        productId: productId || undefined, // If product-specific, ensure they bought it
        status: 'COMPLETED'
      }
    });

    // For now, let's allow reviews without strict purchase check to gather initial feedback
    // if (hasPurchased === 0) {
    //   return res.status(403).json({ error: 'You can only review products you have purchased.' });
    // }

    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
    });
    res.status(201).json({ message: 'Review submitted successfully!', review });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review.' });
  }
});

// 2. Get all approved reviews (Public)
router.get('/', async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { isApproved: true },
      include: {
        user: {
          select: { name: true, id: true }
        },
        product: {
          select: { name: true, slug: true, id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching approved reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// 3. Get reviews for a specific product (Public)
router.get('/product/:productId', async (req, res) => {
  const productId = parseInt(req.params.productId);
  try {
    const reviews = await prisma.review.findMany({
      where: { productId, isApproved: true },
      include: {
        user: {
          select: { name: true, id: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({ error: 'Failed to fetch product reviews.' });
  }
});

// ADMIN Routes for Reviews
// 4. Get all reviews (Admin)
router.get('/admin', requireAuth, requireAdmin, async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        user: {
          select: { name: true, email: true }
        },
        product: {
          select: { name: true, slug: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ reviews });
  } catch (error) {
    console.error('Error fetching all reviews (Admin):', error);
    res.status(500).json({ error: 'Failed to fetch all reviews.' });
  }
});

// 5. Approve/Reject a review (Admin)
router.patch('/admin/:id/approve', requireAuth, requireAdmin, async (req, res) => {
  const reviewId = parseInt(req.params.id);
  const { isApproved } = req.body; // true or false

  try {
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: isApproved === true }, // Ensure boolean type
    });
    res.json({ message: 'Review approval status updated.', review: updatedReview });
  } catch (error) {
    console.error('Error updating review approval status:', error);
    res.status(500).json({ error: 'Failed to update review approval status.' });
  }
});

// 6. Delete a review (Admin)
router.delete('/admin/:id', requireAuth, requireAdmin, async (req, res) => {
  const reviewId = parseInt(req.params.id);

  try {
    await prisma.review.delete({
      where: { id: reviewId },
    });
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review.' });
  }
});

export default router;
