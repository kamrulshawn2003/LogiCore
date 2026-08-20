const categoryService = require('../services/categoryService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class CategoryController {
  async getAllCategories(req, res, next) {
    try {
      const result = await categoryService.getAllCategories(req.query);
      res.json(
        ApiResponse.success(result.categories, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getCategoryById(req, res, next) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      res.json(
        ApiResponse.success({ category })
      );
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const category = await categoryService.createCategory(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'CATEGORY_CREATE',
        entity_type: 'Category',
        entity_id: category.id,
        new_value: { name: category.name },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ category })
      );
    } catch (error) {
      if (error.message === 'Category with this name already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const categoryId = req.params.id;
      const oldCategory = await categoryService.getCategoryById(categoryId);
      const category = await categoryService.updateCategory(categoryId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'CATEGORY_UPDATE',
        entity_type: 'Category',
        entity_id: category.id,
        old_value: { name: oldCategory.name, status: oldCategory.status },
        new_value: { name: category.name, status: category.status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ category })
      );
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'CATEGORY_DELETE',
        entity_type: 'Category',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Category not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      if (error.message === 'Cannot delete category with associated products') {
        return res.status(400).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }
}

module.exports = new CategoryController();