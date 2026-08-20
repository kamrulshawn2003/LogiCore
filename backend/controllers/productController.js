const productService = require('../services/productService');
const ApiResponse = require('../utils/ApiResponse');
const { validationResult } = require('express-validator');
const { AuditLog } = require('../models');

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const result = await productService.getAllProducts(req.query);
      res.json(
        ApiResponse.success(result.products, result.pagination)
      );
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      res.json(
        ApiResponse.success({ product })
      );
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const product = await productService.createProduct(req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PRODUCT_CREATE',
        entity_type: 'Product',
        entity_id: product.id,
        new_value: { sku: product.sku, name: product.name, price: product.price },
        ip_address: req.ip
      });
      
      res.status(201).json(
        ApiResponse.success({ product })
      );
    } catch (error) {
      if (error.message === 'Product with this SKU already exists') {
        return res.status(409).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json(
          ApiResponse.error('Validation failed', errors.array())
        );
      }
      
      const productId = req.params.id;
      const oldProduct = await productService.getProductById(productId);
      const product = await productService.updateProduct(productId, req.body);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PRODUCT_UPDATE',
        entity_type: 'Product',
        entity_id: product.id,
        old_value: { 
          name: oldProduct.name, 
          price: oldProduct.price, 
          status: oldProduct.status 
        },
        new_value: { 
          name: product.name, 
          price: product.price, 
          status: product.status 
        },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ product })
      );
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(req.params.id);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PRODUCT_DELETE',
        entity_type: 'Product',
        entity_id: req.params.id,
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success(result)
      );
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async updateProductStatus(req, res, next) {
    try {
      const { status } = req.body;
      const product = await productService.updateProductStatus(req.params.id, status);
      
      // Create audit log
      await AuditLog.create({
        user_id: req.user.id,
        action: 'PRODUCT_STATUS_CHANGE',
        entity_type: 'Product',
        entity_id: product.id,
        new_value: { status },
        ip_address: req.ip
      });
      
      res.json(
        ApiResponse.success({ product })
      );
    } catch (error) {
      if (error.message === 'Product not found') {
        return res.status(404).json(
          ApiResponse.error(error.message)
        );
      }
      next(error);
    }
  }

  async getLowStockProducts(req, res, next) {
    try {
      const products = await productService.getLowStockProducts();
      res.json(
        ApiResponse.success({ products })
      );
    } catch (error) {
      next(error);
    }
  }

  async getProductStatistics(req, res, next) {
    try {
      const stats = await productService.getProductStatistics();
      res.json(
        ApiResponse.success({ statistics: stats })
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();