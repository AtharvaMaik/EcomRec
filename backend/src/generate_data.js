const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { getLocalImagePath } = require('./services/imageCatalog');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const CATEGORIES = [
  'Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Personal Care',
  'Sports & Outdoors', 'Toys & Games', 'Books', 'Groceries', 'Health', 'Automotive'
];

const ADJECTIVES = ['Premium', 'Essential', 'Durable', 'Luxury', 'Compact', 'Eco-friendly', 'Smart', 'Classic', 'Modern', 'Vintage'];
const NOUNS = {
  'Electronics': ['Headphones', 'Speaker', 'Monitor', 'Keyboard', 'Mouse', 'Tablet', 'Charger', 'Cable', 'Camera', 'Power Bank'],
  'Clothing': ['T-Shirt', 'Jeans', 'Jacket', 'Sneakers', 'Hat', 'Socks', 'Sweater', 'Dress', 'Scarf', 'Gloves'],
  'Home & Kitchen': ['Blender', 'Coffee Maker', 'Pan', 'Knife Set', 'Towels', 'Lamp', 'Pillow', 'Rug', 'Vase', 'Clock'],
  'Beauty & Personal Care': ['Lotion', 'Shampoo', 'Serum', 'Perfume', 'Lip Balm', 'Mirror', 'Comb', 'Trimmer', 'Soap', 'Sunscreen'],
  'Sports & Outdoors': ['Yoga Mat', 'Dumbbells', 'Tent', 'Water Bottle', 'Backpack', 'Skipping Rope', 'Bicycle Pump', 'Flashlight', 'Compass', 'Towel'],
  'Toys & Games': ['Board Game', 'Puzzle', 'Action Figure', 'Doll', 'Building Blocks', 'Remote Car', 'Kite', 'Yo-yo', 'Slime', 'Cards'],
  'Books': ['Novel', 'Biography', 'Cookbook', 'History Book', 'Sci-Fi Book', 'Journal', 'Dictionary', 'Comic', 'Poetry', 'Guide'],
  'Groceries': ['Coffee Beans', 'Tea', 'Olive Oil', 'Pasta', 'Spices', 'Honey', 'Oats', 'Snack Bar', 'Almonds', 'Chocolate'],
  'Health': ['Vitamins', 'First Aid Kit', 'Thermometer', 'Masks', 'Bandages', 'Scale', 'Massager', 'Pill Organizer', 'Inhaler', 'Sanitizer'],
  'Automotive': ['Wiper Fluid', 'Tire Pressure Gauge', 'Car Wash Soap', 'Wax', 'Floor Mats', 'Phone Mount', 'Jump Starter', 'Air Freshener', 'Microfiber Cloth', 'Scratch Remover']
};

const TAGS = ['Sale', 'New Arrival', 'Best Seller', 'Top Rated', 'Trending', 'Limited Edition', 'Clearance'];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      tags TEXT NOT NULL
    )
  `);

  db.run('DELETE FROM products');

  db.run('BEGIN TRANSACTION');
  const stmt = db.prepare('INSERT INTO products (name, category, price, image_url, tags) VALUES (?, ?, ?, ?, ?)');

  console.log('Generating 10,000 synthetic products...');
  
  for (let i = 0; i < 10000; i++) {
    const category = getRandomElement(CATEGORIES);
    const noun = getRandomElement(NOUNS[category]);
    const adjective = getRandomElement(ADJECTIVES);
    const name = `${adjective} ${noun}`;
    const price = (Math.random() * 200 + 5).toFixed(2);
    
    const image_url = getLocalImagePath(category);
    
    // Select 1 to 3 random tags
    const numTags = getRandomInt(1, 3);
    const productTags = [];
    for(let j=0; j<numTags; j++){
      const t = getRandomElement(TAGS);
      if(!productTags.includes(t)) productTags.push(t);
    }
    
    stmt.run([name, category, price, image_url, productTags.join(',')]);
  }

  stmt.finalize();
  db.run('COMMIT', (err) => {
    if (err) {
      console.error('Error committing transaction:', err);
    } else {
      console.log('Successfully inserted 10,000 products into SQLite database.');
    }
    db.close();
  });
});
