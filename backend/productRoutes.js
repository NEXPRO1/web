const express = require('express');
const { db } = require('./database'); // Assuming db is exported from database.js

const router = express.Router();

// Helper function for promise-based DB all query
function dbQueryAll(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error("Database queryAll error:", err.message, "SQL:", query, "Params:", params);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// --- GET All Products Endpoint (Public) ---
router.get('/', async (req, res) => {
    const productTag = req.query.tag; // Obtener el tag de la query string
    let sql = 'SELECT id, name, description, price, image_url, category FROM Products';
    const params = [];

    if (productTag) {
        // Usar LOWER() para comparación insensible a mayúsculas/minúsculas
        sql += ' WHERE LOWER(category) = LOWER(?) ORDER BY name ASC';
        params.push(productTag);
        console.log(`Fetching products for tag: ${productTag}`);
    } else {
        sql += ' ORDER BY name ASC';
        console.log('Fetching all products.');
    }

    try {
        // dbQueryAll ya debería estar definido en este archivo o importado.
        // Si no, se debe asegurar su disponibilidad.
        // Por el contexto de productRoutes.js, dbQueryAll podría ser una función local:
        /*
        function dbQueryAll(query, queryParams = []) { // Renombrar params a queryParams para evitar colisión
            return new Promise((resolve, reject) => {
                db.all(query, queryParams, (err, rows) => {
                    if (err) {
                        console.error("Database queryAll error:", err.message, "SQL:", query, "Params:", queryParams);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
        }
        */
        // Asumiendo que dbQueryAll ya existe y funciona con el `db` importado.
        const products = await dbQueryAll(sql, params);
        res.status(200).json(products);
    } catch (error) {
        console.error("Error fetching products:", error); // Updated error message context
        res.status(500).json({ message: 'Failed to fetch products.', error: error.message });
    }
});

module.exports = router;
