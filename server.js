require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors({
  origin: 'http://localhost:3001', // Replace with your frontend URL if different
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static('public'));

// Use the MONGODB_URI from .env file
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not defined in the environment variables");
  process.exit(1);
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB with URI:', uri);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Could not connect to MongoDB Atlas", error);
    process.exit(1);
  }
}

connectToDatabase();

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/home.html');
});

app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const db = client.db('userAuth');
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    await usersCollection.insertOne({ username, email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const db = client.db('userAuth');
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful', userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

app.get('/tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = client.db('userAuth');
    const tasksCollection = db.collection('tasks');
    
    const tasks = await tasksCollection.find({ userId: new ObjectId(userId) }).toArray();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
});

app.post('/tasks/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const tasks = req.body;

    if (!Array.isArray(tasks)) {
      return res.status(400).json({ message: 'Tasks must be an array' });
    }

    const db = client.db('userAuth');
    const tasksCollection = db.collection('tasks');
    
    await tasksCollection.deleteMany({ userId: new ObjectId(userId) });
    await tasksCollection.insertMany(tasks.map(task => ({ ...task, userId: new ObjectId(userId) })));
    
    res.status(200).json({ message: 'Tasks saved successfully' });
  } catch (error) {
    console.error('Error saving tasks:', error);
    res.status(500).json({ message: 'Error saving tasks', error: error.message });
  }
});

app.get('/categories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = client.db('userAuth');
    const categoriesCollection = db.collection('categories');
    
    const categories = await categoriesCollection.findOne({ userId: new ObjectId(userId) });
    res.status(200).json(categories ? categories.list : []);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
});

app.post('/categories/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const categories = req.body;

    if (!Array.isArray(categories)) {
      return res.status(400).json({ message: 'Categories must be an array' });
    }

    const db = client.db('userAuth');
    const categoriesCollection = db.collection('categories');
    
    await categoriesCollection.updateOne(
      { userId: new ObjectId(userId) },
      { $set: { list: categories } },
      { upsert: true }
    );
    
    res.status(200).json({ message: 'Categories saved successfully' });
  } catch (error) {
    console.error('Error saving categories:', error);
    res.status(500).json({ message: 'Error saving categories', error: error.message });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

// Ensure that the client will close when you finish/error
process.on('SIGINT', async () => {
  await client.close();
  process.exit(0);
});
