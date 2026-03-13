import type { Express } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../auth";
import { getCurrentUser } from "../demoState";
import { 
  insertForumCategorySchema,
  insertForumPostSchema,
  insertForumReplySchema
} from "@shared/schema";

/**
 * Forum Routes Module
 * 
 * Handles all community forum endpoints including:
 * - Forum categories and post management
 * - User discussions and replies
 * - Community moderation features
 */
export function registerForumRoutes(app: Express) {
  console.log('[ROUTES] Registering forum routes...');

  // Get forum categories (with optional state filter)
  app.get('/api/forum/categories', async (req, res) => {
    try {
      const { state } = req.query;
      const categories = await storage.getForumCategories(state as string);
      res.json(categories);
    } catch (error) {
      console.error('[FORUM] Error fetching categories:', error);
      res.status(500).json({ message: 'Failed to fetch forum categories' });
    }
  });

  // Get a single forum category by ID
  app.get('/api/forum/categories/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const category = await storage.getForumCategory(parseInt(id));
      
      if (!category) {
        return res.status(404).json({ message: 'Forum category not found' });
      }

      res.json(category);
    } catch (error) {
      console.error('[FORUM] Error fetching category:', error);
      res.status(500).json({ message: 'Failed to fetch forum category' });
    }
  });

  // Get forum statistics
  app.get('/api/forum/stats', async (req, res) => {
    try {
      const stats = await storage.getForumStats();
      res.json(stats);
    } catch (error) {
      console.error('[FORUM] Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch forum stats' });
    }
  });

  // Create a new forum category (admin only)
  app.post('/api/forum/categories', isAuthenticated, async (req: any, res) => {
    try {
      // Basic admin check - could be enhanced with proper admin roles
      const user = getCurrentUser();
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
      }

      const categoryData = insertForumCategorySchema.parse(req.body);
      const category = await storage.createForumCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error('[FORUM] Error creating category:', error);
      res.status(500).json({ message: 'Failed to create forum category' });
    }
  });

  // Get posts in a category
  app.get('/api/forum/categories/:categoryId/posts', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { page = '1', limit = '20' } = req.query;
      
      const posts = await storage.getForumPosts(
        parseInt(categoryId), 
        parseInt(page as string), 
        parseInt(limit as string)
      );
      res.json(posts);
    } catch (error) {
      console.error('[FORUM] Error fetching posts:', error);
      res.status(500).json({ message: 'Failed to fetch forum posts' });
    }
  });

  // Create a new forum post
  app.post('/api/forum/posts', isAuthenticated, async (req: any, res) => {
    try {
      const user = getCurrentUser();
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const postData = insertForumPostSchema.parse({
        ...req.body,
        userId: user.id
      });
      
      const post = await storage.createForumPost(postData);
      res.json(post);
    } catch (error) {
      console.error('[FORUM] Error creating post:', error);
      res.status(500).json({ message: 'Failed to create forum post' });
    }
  });

  console.log('[ROUTES] Forum routes registered successfully');
}