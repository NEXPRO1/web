// backend/floatingButtonRoutes.js
const express = require('express');
const { db } = require('./database'); // Asumiendo que db se exporta desde database.js

const router = express.Router();

// Helper function para db.all con promesas (si no está en un módulo utils compartido)
function dbQueryAll(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) {
                console.error("Database queryAll error:", err.message, "SQL:", sql, "Params:", params);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

// GET todos los botones flotantes (para el público)
router.get('/', async (req, res) => {
    console.log('Fetching all floating buttons for public display.');
    try {
        // sort_order is included here as it's used in ORDER BY, client might not need it directly
        // but it ensures consistent order.
        const buttons = await dbQueryAll('SELECT id, button_image_url, target_tag, tooltip_text, sort_order FROM FloatingButtons ORDER BY sort_order ASC, id ASC');
        
        // Client might not need sort_order, let's map to exclude it if not needed for display logic itself
        const clientButtons = buttons.map(b => ({
            id: b.id,
            button_image_url: b.button_image_url,
            target_tag: b.target_tag,
            tooltip_text: b.tooltip_text
            // sort_order is not explicitly passed to client unless needed for client-side sorting too
        }));

        res.status(200).json(clientButtons);
    } catch (error) {
        console.error("Error fetching floating buttons for public:", error);
        res.status(500).json({ message: 'Failed to fetch floating buttons.', error: error.message });
    }
});

module.exports = router;
