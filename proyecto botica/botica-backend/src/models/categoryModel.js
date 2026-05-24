const pool = require('../config/db');

const CategoryModel = {

  findAll: async () => {
    const result = await pool.query(
      `SELECT * FROM category ORDER BY category_name`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT * FROM category WHERE category_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  create: async ({ category_name, category_description }) => {
    const result = await pool.query(
      `INSERT INTO category (category_name, category_description)
       VALUES ($1, $2)
       RETURNING *`,
      [category_name, category_description]
    );
    return result.rows[0];
  },

  update: async (id, { category_name, category_description }) => {
    const result = await pool.query(
      `UPDATE category
       SET category_name = $1, category_description = $2
       WHERE category_id = $3
       RETURNING *`,
      [category_name, category_description, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      `DELETE FROM category WHERE category_id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = CategoryModel;