const mongoose = require('mongoose');

// MongoDB connection string - using provided MongoDB Atlas URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vidyadonthagani:Vidya28@cluster0.wixjktf.mongodb.net/resume?retryWrites=true&w=majority&appName=Cluster0';

async function connectDatabase() {
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB successfully');
        console.log('Using database: resume');
        
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

module.exports = connectDatabase;

