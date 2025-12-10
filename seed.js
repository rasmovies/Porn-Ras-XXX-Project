const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Category = require('./models/Category');
const Video = require('./models/Video');
const Comment = require('./models/Comment');
const Like = require('./models/Like');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/adulttube';

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Video.deleteMany({});
    await Comment.deleteMany({});
    await Like.deleteMany({});
    console.log('Cleared existing data');

    // Create sample users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await User.insertMany([
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/150/FF6B6B/FFFFFF?text=JD',
        bio: 'Video creator and content producer',
        isVerified: true,
        subscribersCount: 1250,
        videosCount: 45
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/150/4ECDC4/FFFFFF?text=JS',
        bio: 'Professional adult content creator',
        isVerified: true,
        subscribersCount: 2100,
        videosCount: 78
      },
      {
        username: 'mike_wilson',
        email: 'mike@example.com',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/150/45B7D1/FFFFFF?text=MW',
        bio: 'Independent filmmaker',
        isVerified: false,
        subscribersCount: 450,
        videosCount: 23
      },
      {
        username: 'sarah_jones',
        email: 'sarah@example.com',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/150/96CEB4/FFFFFF?text=SJ',
        bio: 'Adult entertainment professional',
        isVerified: true,
        subscribersCount: 3200,
        videosCount: 156
      },
      {
        username: 'alex_brown',
        email: 'alex@example.com',
        password: hashedPassword,
        avatar: 'https://via.placeholder.com/150/FECA57/FFFFFF?text=AB',
        bio: 'Content creator and model',
        isVerified: false,
        subscribersCount: 890,
        videosCount: 34
      }
    ]);
    console.log('Created sample users');

    // Create sample categories
    const categories = await Category.insertMany([
      {
        name: 'Romance',
        description: 'Romantic and intimate content',
        thumbnail: 'https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Romance',
        videoCount: 25,
        isActive: true
      },
      {
        name: 'Drama',
        description: 'Dramatic adult content',
        thumbnail: 'https://via.placeholder.com/300x200/4ECDC4/FFFFFF?text=Drama',
        videoCount: 18,
        isActive: true
      },
      {
        name: 'Comedy',
        description: 'Funny and entertaining adult content',
        thumbnail: 'https://via.placeholder.com/300x200/45B7D1/FFFFFF?text=Comedy',
        videoCount: 32,
        isActive: true
      },
      {
        name: 'Action',
        description: 'Action-packed adult content',
        thumbnail: 'https://via.placeholder.com/300x200/96CEB4/FFFFFF?text=Action',
        videoCount: 15,
        isActive: true
      },
      {
        name: 'Fantasy',
        description: 'Fantasy and roleplay content',
        thumbnail: 'https://via.placeholder.com/300x200/FECA57/FFFFFF?text=Fantasy',
        videoCount: 28,
        isActive: true
      },
      {
        name: 'Sci-Fi',
        description: 'Science fiction adult content',
        thumbnail: 'https://via.placeholder.com/300x200/FF9FF3/FFFFFF?text=Sci-Fi',
        videoCount: 12,
        isActive: true
      }
    ]);
    console.log('Created sample categories');

    // Create sample videos
    const sampleVideos = [
      {
        title: 'Romantic Evening',
        description: 'A beautiful romantic evening with stunning visuals and intimate moments.',
        thumbnail: 'https://via.placeholder.com/640x360/FF6B6B/FFFFFF?text=Romantic+Evening',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: 1800, // 30 minutes
        views: 15420,
        likes: 1250,
        dislikes: 45,
        isPublished: true,
        isFeatured: true,
        isTrending: true,
        uploader: users[0]._id,
        category: categories[0]._id,
        tags: ['romance', 'intimate', 'evening', 'beautiful'],
        actors: ['John Doe', 'Jane Smith'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        title: 'Dramatic Story',
        description: 'An intense dramatic story with compelling characters and plot.',
        thumbnail: 'https://via.placeholder.com/640x360/4ECDC4/FFFFFF?text=Dramatic+Story',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        duration: 2400, // 40 minutes
        views: 8930,
        likes: 890,
        dislikes: 23,
        isPublished: true,
        isFeatured: false,
        isTrending: true,
        uploader: users[1]._id,
        category: categories[1]._id,
        tags: ['drama', 'intense', 'story', 'compelling'],
        actors: ['Jane Smith', 'Mike Wilson'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        title: 'Comedy Gold',
        description: 'Hilarious comedy content that will make you laugh out loud.',
        thumbnail: 'https://via.placeholder.com/640x360/45B7D1/FFFFFF?text=Comedy+Gold',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
        duration: 1200, // 20 minutes
        views: 25680,
        likes: 2100,
        dislikes: 67,
        isPublished: true,
        isFeatured: true,
        isTrending: false,
        uploader: users[2]._id,
        category: categories[2]._id,
        tags: ['comedy', 'funny', 'hilarious', 'entertaining'],
        actors: ['Mike Wilson', 'Sarah Jones'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        title: 'Action Packed',
        description: 'High-energy action content with thrilling sequences.',
        thumbnail: 'https://via.placeholder.com/640x360/96CEB4/FFFFFF?text=Action+Packed',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4',
        duration: 2100, // 35 minutes
        views: 18750,
        likes: 1650,
        dislikes: 89,
        isPublished: true,
        isFeatured: false,
        isTrending: true,
        uploader: users[3]._id,
        category: categories[3]._id,
        tags: ['action', 'thrilling', 'high-energy', 'intense'],
        actors: ['Sarah Jones', 'Alex Brown'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 days ago
      },
      {
        title: 'Fantasy Adventure',
        description: 'Magical fantasy adventure with incredible special effects.',
        thumbnail: 'https://via.placeholder.com/640x360/FECA57/FFFFFF?text=Fantasy+Adventure',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
        duration: 2700, // 45 minutes
        views: 32100,
        likes: 2800,
        dislikes: 156,
        isPublished: true,
        isFeatured: true,
        isTrending: false,
        uploader: users[4]._id,
        category: categories[4]._id,
        tags: ['fantasy', 'magical', 'adventure', 'special-effects'],
        actors: ['Alex Brown', 'John Doe'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        title: 'Sci-Fi Future',
        description: 'Futuristic sci-fi content with amazing visuals and technology.',
        thumbnail: 'https://via.placeholder.com/640x360/FF9FF3/FFFFFF?text=Sci-Fi+Future',
        videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
        duration: 1950, // 32.5 minutes
        views: 14200,
        likes: 1200,
        dislikes: 78,
        isPublished: true,
        isFeatured: false,
        isTrending: true,
        uploader: users[0]._id,
        category: categories[5]._id,
        tags: ['sci-fi', 'futuristic', 'technology', 'amazing'],
        actors: ['John Doe', 'Jane Smith', 'Mike Wilson'],
        ageRestriction: '18+',
        contentRating: 'Mature',
        uploadDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      }
    ];

    const videos = await Video.insertMany(sampleVideos);
    console.log('Created sample videos');

    // Create sample comments
    const sampleComments = [
      {
        video: videos[0]._id,
        user: users[1]._id,
        content: 'Amazing video! Love the romantic atmosphere.',
        likes: 45,
        dislikes: 2,
        isPinned: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        video: videos[0]._id,
        user: users[2]._id,
        content: 'Great quality and production value. Keep it up!',
        likes: 32,
        dislikes: 1,
        isPinned: false,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        video: videos[1]._id,
        user: users[0]._id,
        content: 'The dramatic tension in this video is incredible!',
        likes: 67,
        dislikes: 3,
        isPinned: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        video: videos[2]._id,
        user: users[3]._id,
        content: 'This had me laughing the whole time! 😂',
        likes: 89,
        dislikes: 5,
        isPinned: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        video: videos[3]._id,
        user: users[4]._id,
        content: 'The action sequences are so well choreographed!',
        likes: 56,
        dislikes: 2,
        isPinned: false,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
      }
    ];

    await Comment.insertMany(sampleComments);
    console.log('Created sample comments');

    // Create sample likes
    const sampleLikes = [
      { video: videos[0]._id, user: users[1]._id, isLike: true },
      { video: videos[0]._id, user: users[2]._id, isLike: true },
      { video: videos[0]._id, user: users[3]._id, isLike: true },
      { video: videos[1]._id, user: users[0]._id, isLike: true },
      { video: videos[1]._id, user: users[2]._id, isLike: true },
      { video: videos[2]._id, user: users[0]._id, isLike: true },
      { video: videos[2]._id, user: users[1]._id, isLike: true },
      { video: videos[2]._id, user: users[3]._id, isLike: true },
      { video: videos[3]._id, user: users[0]._id, isLike: true },
      { video: videos[3]._id, user: users[2]._id, isLike: true },
      { video: videos[4]._id, user: users[1]._id, isLike: true },
      { video: videos[4]._id, user: users[3]._id, isLike: true },
      { video: videos[5]._id, user: users[0]._id, isLike: true },
      { video: videos[5]._id, user: users[2]._id, isLike: true }
    ];

    await Like.insertMany(sampleLikes);
    console.log('Created sample likes');

    // Update category video counts
    for (let category of categories) {
      const videoCount = await Video.countDocuments({ category: category._id, isPublished: true });
      await Category.findByIdAndUpdate(category._id, { videoCount });
    }

    // Update user video counts
    for (let user of users) {
      const videoCount = await Video.countDocuments({ uploader: user._id, isPublished: true });
      await User.findByIdAndUpdate(user._id, { videosCount: videoCount });
    }

    console.log('Database seeded successfully!');
    console.log(`Created ${users.length} users, ${categories.length} categories, ${videos.length} videos`);
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the seed function
seedDatabase();

