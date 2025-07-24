const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Template = require('../models/Template');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../public/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        if (file.fieldname === 'previewImage') {
            // Check if the file is an image
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Preview image must be an image file'), false);
            }
        } else if (file.fieldname === 'htmlFile') {
            // Check if the file is HTML
            if (file.mimetype === 'text/html' || path.extname(file.originalname).toLowerCase() === '.html') {
                cb(null, true);
            } else {
                cb(new Error('Template file must be an HTML file'), false);
            }
        } else {
            cb(new Error('Unexpected field'), false);
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Get all templates
router.get('/', async (req, res) => {
    try {
        const templates = await Template.find().sort({ createdAt: -1 });
        res.json(templates);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get template stats
router.get('/stats', async (req, res) => {
    try {
        const totalTemplates = await Template.countDocuments();
        const totalDownloads = await Template.aggregate([
            { $group: { _id: null, total: { $sum: '$downloads' } } }
        ]);
        
        res.json({
            totalTemplates,
            totalDownloads: totalDownloads[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get single template
router.get('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new template
router.post('/', upload.fields([
    { name: 'previewImage', maxCount: 1 },
    { name: 'htmlFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const { name, category, industry, rating } = req.body;
        
        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        let previewImagePath = null;
        let htmlContent = '';

        // Handle preview image
        if (req.files && req.files.previewImage) {
            previewImagePath = `/uploads/${req.files.previewImage[0].filename}`;
        }

        // Handle HTML file
        if (req.files && req.files.htmlFile) {
            const htmlFilePath = req.files.htmlFile[0].path;
            htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            // Delete the uploaded HTML file as we store content in database
            fs.unlinkSync(htmlFilePath);
        } else {
            return res.status(400).json({ error: 'HTML file is required' });
        }

        const template = new Template({
            name,
            category,
            industry: industry || '',
            rating: parseFloat(rating) || 0.0,
            previewImagePath,
            htmlContent
        });

        await template.save();
        res.status(201).json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update template
router.put('/:id', upload.fields([
    { name: 'previewImage', maxCount: 1 },
    { name: 'htmlFile', maxCount: 1 }
]), async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const { name, category, industry, rating } = req.body;
        
        // Update basic fields
        if (name) template.name = name;
        if (category) template.category = category;
        if (industry !== undefined) template.industry = industry;
        if (rating !== undefined) template.rating = parseFloat(rating);

        // Handle preview image update
        if (req.files && req.files.previewImage) {
            // Delete old image if exists
            if (template.previewImagePath) {
                const oldImagePath = path.join(__dirname, '../public', template.previewImagePath);
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            template.previewImagePath = `/uploads/${req.files.previewImage[0].filename}`;
        }

        // Handle HTML file update
        if (req.files && req.files.htmlFile) {
            const htmlFilePath = req.files.htmlFile[0].path;
            template.htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
            // Delete the uploaded HTML file
            fs.unlinkSync(htmlFilePath);
        }

        await template.save();
        res.json(template);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete template
router.delete('/:id', async (req, res) => {
    try {
        const template = await Template.findById(req.params.id);
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        // Delete associated image file
        if (template.previewImagePath) {
            const imagePath = path.join(__dirname, '../public', template.previewImagePath);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        await Template.findByIdAndDelete(req.params.id);
        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Increment download count
router.post('/:id/download', async (req, res) => {
    try {
        const template = await Template.findByIdAndUpdate(
            req.params.id,
            { $inc: { downloads: 1 } },
            { new: true }
        );
        
        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }
        
        res.json({ message: 'Download count updated', downloads: template.downloads });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

