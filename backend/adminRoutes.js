const express = require('express');
const { db } = require('./database'); 
const { verifyToken } = require('./authRoutes'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs'); 

const router = express.Router();

const BACKEND_BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000'; 

// Ensure the general uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// --- Multer storage for Product Images ---
const productUploadsDir = path.join(uploadsDir, 'products');
if (!fs.existsSync(productUploadsDir)) {
    fs.mkdirSync(productUploadsDir, { recursive: true });
}
const productStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, productUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// --- Multer storage for Floating Button Images ---
const floatingButtonUploadsDir = path.join(__dirname, 'uploads', 'floating_buttons');
if (!fs.existsSync(floatingButtonUploadsDir)) {
    fs.mkdirSync(floatingButtonUploadsDir, { recursive: true });
}
const floatingButtonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, floatingButtonUploadsDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'floatingbutton-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Multer file filter (reusable for images)
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif' || file.mimetype === 'image/svg+xml') {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file type! Please upload only JPEG, PNG, GIF, or SVG images.'), false);
    }
};

const uploadProductImage = multer({ 
    storage: productStorage,
    fileFilter: fileFilter,
    limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit
});

const uploadFloatingButtonImage = multer({ 
    storage: floatingButtonStorage,
    fileFilter: fileFilter, // Reusing the same image filter
    limits: { fileSize: 1024 * 1024 * 2 } // 2MB limit for button images
});


// Configuration
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'; 

// --- verifyAdmin Middleware ---
const verifyAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Access denied. No user context.' });
    }
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Forbidden. Admin access required.' });
    }
    next();
};

// --- Database Helper Functions ---
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

function dbQueryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                console.error("Database queryOne error:", err.message, "SQL:", sql, "Params:", params);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function dbRun(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) { 
            if (err) {
                console.error("Database run error:", err.message, "SQL:", query, "Params:", params);
                reject(err);
            } else {
                resolve({ lastID: this.lastID, changes: this.changes });
            }
        });
    });
}

// --- Affiliate Referrals Routes (Admin) ---
router.get('/all-referrals', verifyToken, verifyAdmin, async (req, res) => {
    const sql = `
        SELECT 
            ar.id as referral_id, ar.commission_earned, ar.commission_rate_at_referral, 
            ar.status as commission_status, ar.created_at as commission_date,
            o.id as order_id, o.order_date, o.total_amount as order_total_amount,
            AffiliateUser.name as affiliate_name, AffiliateUser.email as affiliate_email,
            ReferredCustomer.name as customer_name, ReferredCustomer.email as customer_email
        FROM AffiliateReferrals ar
        JOIN Users AffiliateUser ON ar.referring_user_id = AffiliateUser.id
        JOIN Users ReferredCustomer ON ar.referred_user_id = ReferredCustomer.id
        JOIN Orders o ON ar.referred_order_id = o.id
        ORDER BY ar.created_at DESC
    `;
    try {
        const referrals = await dbQueryAll(sql);
        res.status(200).json(referrals);
    } catch (error) {
        console.error("Error fetching all affiliate referrals:", error);
        res.status(500).json({ message: 'Failed to fetch all affiliate referrals.', error: error.message });
    }
});

router.put('/referrals/:referralId/status', verifyToken, verifyAdmin, async (req, res) => {
    const { referralId } = req.params;
    const { status } = req.body;
    const validStatuses = ['pending', 'approved', 'paid', 'rejected'];
    if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.', validStatuses });
    }
    if (!referralId || isNaN(parseInt(referralId))) {
        return res.status(400).json({ message: 'Invalid referral ID provided.' });
    }
    const sql = 'UPDATE AffiliateReferrals SET status = ? WHERE id = ?';
    try {
        const result = await dbRun(sql, [status, referralId]);
        if (result.changes === 0) {
            return res.status(404).json({ message: `Referral with ID ${referralId} not found.` });
        }
        res.status(200).json({ message: `Referral ID ${referralId} status updated to ${status}.` });
    } catch (error) {
        console.error("Error updating referral status:", error.message);
        return res.status(500).json({ message: 'Failed to update referral status.', error: error.message });
    }
});

// --- Product Management Routes (Admin) ---
router.post('/products', verifyToken, verifyAdmin, function(req, res, next) {
    uploadProductImage.single('productImage')(req, res, function(err) {
        if (err instanceof multer.MulterError) {
            console.error('[Admin Add Product] MulterError:', err);
            return res.status(400).json({ message: 'File upload error: ' + err.message });
        } else if (err) {
            console.error('[Admin Add Product] FileFilter/Unknown Upload Error:', err.message);
            return res.status(400).json({ message: err.message || 'File type not allowed or unknown upload error.' });
        }
        next();
    });
}, async (req, res) => {
    const { name, description, price, category } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: 'Product name is required.' });
    }
    if (price === undefined || price === null) {
        return res.status(400).json({ message: 'Product price is required.' });
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
        return res.status(400).json({ message: 'Product price must be a positive number.' });
    }
    let imageUrlForDb = null; 
    if (req.file) {
        imageUrlForDb = `${BACKEND_BASE_URL}/uploads/products/${req.file.filename}`;
    }
    const finalCategory = (typeof category === 'string' && category.trim() !== '') ? category.trim() : null;
    const finalDescription = (typeof description === 'string' && description.trim() !== '') ? description.trim() : null;
    const sql = 'INSERT INTO Products (name, description, price, image_url, category) VALUES (?, ?, ?, ?, ?)';
    try {
        const result = await dbRun(sql, [name.trim(), finalDescription, numericPrice, imageUrlForDb, finalCategory]);
        const newProduct = await dbQueryOne('SELECT * FROM Products WHERE id = ?', [result.lastID]);
        if (!newProduct) {
            return res.status(201).json({ message: 'Product added, but failed to fetch details.', productId: result.lastID });
        }
        res.status(201).json({ message: 'Product added successfully.', product: newProduct });
    } catch (error) {
        console.error("Error adding new product:", error.message);
        if (req.file) { // If there's an error after file upload, delete the file
            fs.unlink(path.join(productUploadsDir, req.file.filename), (unlinkErr) => {
                if (unlinkErr) console.error("Error deleting uploaded product image after DB error:", unlinkErr);
            });
        }
        if (error.message.includes('UNIQUE constraint failed: Products.name')) {
            return res.status(409).json({ message: 'Product name already exists.' });
        }
        res.status(500).json({ message: 'Failed to add product.', error: error.message });
    }
});

// --- Floating Buttons CRUD Routes (Admin) ---

// POST (Create) a new floating button
router.post('/floating-buttons', verifyToken, verifyAdmin, uploadFloatingButtonImage.single('buttonImage'), async (req, res) => {
    const { target_tag, tooltip_text, sort_order } = req.body;
    
    if (!req.file) {
        return res.status(400).json({ message: 'Button image is required.' });
    }
    if (!target_tag || typeof target_tag !== 'string' || target_tag.trim() === '') {
        return res.status(400).json({ message: 'Target tag is required.' });
    }

    const button_image_url = `${BACKEND_BASE_URL}/uploads/floating_buttons/${req.file.filename}`;
    const finalSortOrder = sort_order ? parseInt(sort_order, 10) : 0;

    try {
        const sql = 'INSERT INTO FloatingButtons (button_image_url, target_tag, tooltip_text, sort_order) VALUES (?, ?, ?, ?)';
        const result = await dbRun(sql, [button_image_url, target_tag.trim(), tooltip_text ? tooltip_text.trim() : null, finalSortOrder]);
        const newButton = await dbQueryOne('SELECT * FROM FloatingButtons WHERE id = ?', [result.lastID]);
        
        if (!newButton) {
            // This case is unlikely if insert succeeded, but good for robustness
            return res.status(201).json({ message: 'Floating button added, but failed to fetch details.', buttonId: result.lastID });
        }
        res.status(201).json({ message: 'Floating button added successfully.', button: newButton });
    } catch (error) {
        console.error("Error adding new floating button:", error);
        fs.unlink(path.join(floatingButtonUploadsDir, req.file.filename), (unlinkErr) => {
            if (unlinkErr) console.error("Error deleting uploaded floating button image after DB error:", unlinkErr);
        });
        res.status(500).json({ message: 'Failed to add floating button.', error: error.message });
    }
});

// GET all floating buttons
router.get('/floating-buttons', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const buttons = await dbQueryAll('SELECT * FROM FloatingButtons ORDER BY sort_order ASC, id ASC');
        res.status(200).json(buttons);
    } catch (error) {
        console.error("Error fetching floating buttons for admin:", error);
        res.status(500).json({ message: 'Failed to fetch floating buttons.', error: error.message });
    }
});

// DELETE a floating button
router.delete('/floating-buttons/:id', verifyToken, verifyAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        const buttonDetails = await dbQueryOne('SELECT button_image_url FROM FloatingButtons WHERE id = ?', [id]);

        if (!buttonDetails) {
            return res.status(404).json({ message: 'Floating button not found.' });
        }

        const result = await dbRun('DELETE FROM FloatingButtons WHERE id = ?', [id]);
        if (result.changes === 0) {
            // Should have been caught by the check above, but as a safeguard
            return res.status(404).json({ message: 'Floating button not found or already deleted.' });
        }

        if (buttonDetails.button_image_url) {
            const filename = path.basename(new URL(buttonDetails.button_image_url).pathname); // More robust way to get filename from URL
            const imagePath = path.join(floatingButtonUploadsDir, filename);
            
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== 'ENOENT') { // ENOENT means file not found, which is fine if already deleted
                    console.error(`Failed to delete image file ${imagePath}:`, err);
                } else if (!err) {
                    console.log(`Deleted image file: ${imagePath}`);
                }
            });
        }
        res.status(200).json({ message: 'Floating button deleted successfully.' });
    } catch (error) {
        console.error("Error deleting floating button:", error);
        res.status(500).json({ message: 'Failed to delete floating button.', error: error.message });
    }
});


module.exports = router;
