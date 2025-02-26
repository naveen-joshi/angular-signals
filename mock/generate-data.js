const fs = require('fs');
const path = require('path');

function generateMockData(count) {
  const users = [];
  const roles = ['Admin', 'User', 'Manager', 'Developer', 'Analyst'];
  const statuses = ['Active', 'Inactive', 'Pending'];
  
  for (let i = 1; i <= count; i++) {
    users.push({
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: roles[Math.floor(Math.random() * roles.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      age: Math.floor(Math.random() * 40) + 20,
      joinDate: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365)).toISOString().split('T')[0],
      salary: Math.floor(Math.random() * 50000) + 30000
    });
  }

  const products = [];
  const categories = ['Electronics', 'Books', 'Clothing', 'Food', 'Sports'];
  
  for (let i = 1; i <= count; i++) {
    products.push({
      id: i,
      name: `Product ${i}`,
      category: categories[Math.floor(Math.random() * categories.length)],
      price: +(Math.random() * 1000).toFixed(2),
      stock: Math.floor(Math.random() * 1000),
      rating: +(Math.random() * 5).toFixed(1),
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 30)).toISOString()
    });
  }

  return {
    users,
    products
  };
}

const data = generateMockData(10000);
fs.writeFileSync(
  path.join(__dirname, 'db.json'),
  JSON.stringify(data, null, 2)
);

console.log('Mock data generated successfully!');
