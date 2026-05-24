const pool = require('../config/db');

const PaymentModel = {

  findAll: async () => {
    const result = await pool.query(
      `SELECT p.*, o.order_state, o.total_price AS order_total
       FROM payment p
       LEFT JOIN orders o ON p.order_id = o.order_id
       ORDER BY p.payment_id DESC`
    );
    return result.rows;
  },

  findById: async (id) => {
    const result = await pool.query(
      `SELECT p.*, o.order_state, o.total_price AS order_total
       FROM payment p
       LEFT JOIN orders o ON p.order_id = o.order_id
       WHERE p.payment_id = $1`,
      [id]
    );
    return result.rows[0];
  },

  findByOrder: async (order_id) => {
    const result = await pool.query(
      `SELECT * FROM payment WHERE order_id = $1`,
      [order_id]
    );
    return result.rows[0];
  },

  create: async ({ payment_method, total_price, voucher_type,
                   email_pay, phone_pay, order_id }) => {
    const result = await pool.query(
      `INSERT INTO payment 
        (payment_method, total_price, voucher_type, email_pay, phone_pay, order_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [payment_method, total_price, voucher_type, email_pay, phone_pay, order_id]
    );
    return result.rows[0];
  },

  update: async (id, { payment_method, voucher_type, email_pay, phone_pay }) => {
    const result = await pool.query(
      `UPDATE payment
       SET payment_method=$1, voucher_type=$2, email_pay=$3, phone_pay=$4
       WHERE payment_id=$5
       RETURNING *`,
      [payment_method, voucher_type, email_pay, phone_pay, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      `DELETE FROM payment WHERE payment_id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }
};

module.exports = PaymentModel;