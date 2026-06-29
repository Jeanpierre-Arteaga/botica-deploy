const pool = require('../config/db');

const ProductModel = {

  findAll: async (filtros = {}) => {
    // Express entrega query params como strings; normalizamos a int/bool/null.
    const toInt = (v) => {
      if (v === undefined || v === null || v === '') return null;
      const n = parseInt(v, 10);
      return Number.isNaN(n) ? null : n;
    };
    const toBool = (v) => {
      if (v === true || v === 'true') return true;
      if (v === false || v === 'false') return false;
      return null;
    };
    // Recorta espacios: " parace " → "parace" (antes rompía la búsqueda).
    const toStr = (v) => {
      if (v === undefined || v === null) return null;
      const s = String(v).trim();
      return s === '' ? null : s;
    };

    const location_id   = toInt(filtros.location_id);
    const nombre        = toStr(filtros.nombre);
    const laboratory_id = toInt(filtros.laboratory_id);
    const category_id   = toInt(filtros.category_id);
    const is_offer      = toBool(filtros.is_offer);
    // include_inactive: por defecto FALSE → solo productos activos (catálogo
    // público). El panel admin lo pasa en true para gestionar también los
    // desactivados. No altera el comportamiento existente.
    const include_inactive =
      filtros.include_inactive === true || filtros.include_inactive === 'true';

    const result = await pool.query(
      `SELECT DISTINCT ON (p.product_id)
              p.product_id, p.product_name, p.active_ingredient, p.product_composition,
              p.contraindications, p.adverse_effects, p.product_batch, p.expiration_date,
              p.health_record, p.is_generic, p.product_price, p.old_price,
              p.is_active, p.is_offer, p.laboratory_id, p.category_id,
              l.laboratory_name,
              c.category_name,
              img.url AS image_url,
              COALESCE(i.current_stock, 0) AS current_stock,
              COALESCE(i.min_stock, 0)     AS min_stock
         FROM product p
         LEFT JOIN laboratory l   ON l.laboratory_id = p.laboratory_id
         LEFT JOIN category   c   ON c.category_id   = p.category_id
         LEFT JOIN image      img ON img.product_id  = p.product_id AND img.type = 'main'
         LEFT JOIN inventory  i   ON i.product_id    = p.product_id
                                  AND ($1::int IS NULL OR i.location_id = $1::int)
        WHERE ($6::boolean = true OR p.is_active = true)
          -- Búsqueda por NOMBRE, PRINCIPIO ACTIVO, CATEGORÍA y LABORATORIO.
          -- Parcial (ILIKE %..%), insensible a mayúsculas Y a tildes (unaccent
          -- en ambos lados). Antes solo cubría nombre + principio activo y era
          -- sensible a acentos → "analgesicos"/"genfar" no devolvían nada.
          AND ($2::text IS NULL OR (
                 unaccent(p.product_name)                  ILIKE '%' || unaccent($2::text) || '%'
              OR unaccent(COALESCE(p.active_ingredient,'')) ILIKE '%' || unaccent($2::text) || '%'
              OR unaccent(COALESCE(c.category_name,''))     ILIKE '%' || unaccent($2::text) || '%'
              OR unaccent(COALESCE(l.laboratory_name,''))   ILIKE '%' || unaccent($2::text) || '%'
          ))
          AND ($3::int     IS NULL OR p.laboratory_id = $3::int)
          AND ($4::int     IS NULL OR p.category_id   = $4::int)
          AND ($5::boolean IS NULL OR p.is_offer      = $5::boolean)
        ORDER BY p.product_id, p.product_name`,
      [location_id, nombre, laboratory_id, category_id, is_offer, include_inactive]
    );
    return result.rows;
  },

  findById: async (id, location_id = null) => {
    const result = await pool.query(
      `SELECT p.product_id, p.product_name, p.active_ingredient, p.product_composition,
              p.contraindications, p.adverse_effects, p.product_batch, p.expiration_date,
              p.health_record, p.is_generic, p.product_price, p.old_price,
              p.is_active, p.is_offer, p.laboratory_id, p.category_id,
              l.laboratory_name,
              c.category_name,
              img.url AS image_url,
              COALESCE(i.current_stock, 0) AS current_stock,
              COALESCE(i.min_stock, 0)     AS min_stock
         FROM product p
         LEFT JOIN laboratory l   ON l.laboratory_id = p.laboratory_id
         LEFT JOIN category   c   ON c.category_id   = p.category_id
         LEFT JOIN image      img ON img.product_id  = p.product_id AND img.type = 'main'
         LEFT JOIN inventory  i   ON i.product_id    = p.product_id
                                  AND ($2::int IS NULL OR i.location_id = $2::int)
        WHERE p.product_id = $1::int
        LIMIT 1`,
      [id, location_id]
    );
    return result.rows[0];
  },

  // Sugerencias para el autocompletado (dropdown). Mismo criterio de búsqueda
  // que findAll (nombre/principio/categoría/laboratorio, parcial, sin tildes),
  // pero ordenado por RELEVANCIA (coincidencia al inicio del nombre primero) y
  // limitado (top N). Solo productos activos.
  searchSuggestions: async (q, limit = 8) => {
    const result = await pool.query(
      `SELECT p.product_id, p.product_name, p.product_price, p.old_price,
              p.is_offer, p.active_ingredient,
              c.category_name,
              l.laboratory_name,
              img.url AS image_url
         FROM product p
         LEFT JOIN category   c   ON c.category_id   = p.category_id
         LEFT JOIN laboratory l   ON l.laboratory_id = p.laboratory_id
         LEFT JOIN image      img ON img.product_id  = p.product_id AND img.type = 'main'
        WHERE p.is_active = true
          AND (
                 unaccent(p.product_name)                  ILIKE '%' || unaccent($1::text) || '%'
              OR unaccent(COALESCE(p.active_ingredient,'')) ILIKE '%' || unaccent($1::text) || '%'
              OR unaccent(COALESCE(c.category_name,''))     ILIKE '%' || unaccent($1::text) || '%'
              OR unaccent(COALESCE(l.laboratory_name,''))   ILIKE '%' || unaccent($1::text) || '%'
          )
        ORDER BY
          CASE WHEN unaccent(p.product_name) ILIKE unaccent($1::text) || '%' THEN 0 ELSE 1 END,
          p.product_name ASC
        LIMIT $2::int`,
      [q, limit]
    );
    return result.rows;
  },

  checkStock: async (product_id, location_id) => {
    const result = await pool.query(
      `SELECT current_stock, min_stock 
       FROM inventory
       WHERE product_id = $1 AND location_id = $2`,
      [product_id, location_id]
    );
    return result.rows[0];
  },

  create: async (data) => {
    const {
      product_name, active_ingredient, product_composition,
      contraindications, adverse_effects, product_batch,
      expiration_date, health_record, is_generic,
      product_price, laboratory_id, category_id,
      is_offer = false, old_price = null
    } = data;

    const result = await pool.query(
      `INSERT INTO product
        (product_name, active_ingredient, product_composition, contraindications,
         adverse_effects, product_batch, expiration_date, health_record,
         is_generic, product_price, laboratory_id, category_id, is_offer, old_price, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)
       RETURNING *`,
      [product_name, active_ingredient, product_composition, contraindications,
       adverse_effects, product_batch, expiration_date, health_record,
       is_generic, product_price, laboratory_id, category_id, is_offer, old_price]
    );
    return result.rows[0];
  },

  update: async (id, data) => {
    const {
      product_name, active_ingredient, product_composition,
      contraindications, adverse_effects, product_batch,
      expiration_date, health_record, is_generic,
      product_price, laboratory_id, category_id, is_offer,
      old_price = null
    } = data;

    const result = await pool.query(
      `UPDATE product SET
        product_name=$1, active_ingredient=$2, product_composition=$3,
        contraindications=$4, adverse_effects=$5, product_batch=$6,
        expiration_date=$7, health_record=$8, is_generic=$9,
        product_price=$10, laboratory_id=$11, category_id=$12, is_offer=$13,
        old_price=$14
       WHERE product_id=$15
       RETURNING *`,
      [product_name, active_ingredient, product_composition, contraindications,
       adverse_effects, product_batch, expiration_date, health_record,
       is_generic, product_price, laboratory_id, category_id, is_offer, old_price, id]
    );
    return result.rows[0];
  },

  patch: async (id, campos) => {
    // Allowlist defensiva: nunca interpolar keys del body directamente al SQL.
    const ALLOWED_PATCH_FIELDS = [
      'product_name', 'active_ingredient', 'product_composition',
      'contraindications', 'adverse_effects', 'product_batch',
      'expiration_date', 'health_record', 'is_generic',
      'product_price', 'old_price', 'is_active', 'is_offer',
      'laboratory_id', 'category_id'
    ];

    const keys = Object.keys(campos || {}).filter(k => ALLOWED_PATCH_FIELDS.includes(k));
    if (keys.length === 0) {
      throw new Error('NO_VALID_FIELDS');
    }

    const values = keys.map(k => campos[k]);
    const setClause = keys.map((k, idx) => `${k} = $${idx + 1}`).join(', ');

    const result = await pool.query(
      `UPDATE product SET ${setClause} WHERE product_id = $${keys.length + 1} RETURNING *`,
      [...values, id]
    );
    return result.rows[0];
  },

  delete: async (id) => {
    const result = await pool.query(
      `UPDATE product SET is_active = false WHERE product_id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  },

  addOffer: async (id, data) => {
    const result = await pool.query(
      `UPDATE product SET is_offer = true, product_price = $1
       WHERE product_id = $2 RETURNING *`,
      [data.product_price, id]
    );
    return result.rows[0];
  }
};

module.exports = ProductModel;