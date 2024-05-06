const express = require('express');
var mysql = require('mysql');
const app = express();
const cors = require('cors');
const bcrypt = require('bcrypt');

const data = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: ''
});

data.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL server:', err);
        return;
    }
    console.log('Connected to MySQL server');

    data.query('CREATE DATABASE IF NOT EXISTS productdb', (err) => {
        if (err) {
            console.error('Error creating database:', err);
            return;
        }
        console.log('Database created or already exists');
        data.query('USE productdb', (err) => {
            if (err) {
                console.error('Error using database:', err);
                return;
            }
            console.log('Using productdb database');
            initializeTables();
        });
    });
});
function initializeTables() {
    const tableQueries = [
        `CREATE TABLE IF NOT EXISTS products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            product_name VARCHAR(150),
            description VARCHAR(255),
            price DECIMAL(10, 2),
            image VARCHAR(255))`,
        `CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50),
            email VARCHAR(50),
            password VARCHAR(50),
            address VARCHAR(50))`,
        `CREATE TABLE IF NOT EXISTS orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            total_amount DECIMAL(10, 2),
            FOREIGN KEY (user_id) REFERENCES users(user_id))`,
        `CREATE TABLE IF NOT EXISTS order_items (
            order_item_id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT,
            product_id INT,
            quantity INT,
            subtotal DECIMAL(10, 2),
            FOREIGN KEY (order_id) REFERENCES orders(order_id),
            FOREIGN KEY (product_id) REFERENCES products(product_id))`
    ];
    tableQueries.forEach((tableQuery) => {
        data.query(tableQuery, (err) => {
            if (err) {
                console.error(`Error creating table:`, err);
                return;
            }
            console.log("All tables have been created");
        });
    });
    initialProducts();
    initializeUsers();
}
function initialProducts() {
    const products = [
        ['Intel Core i9-9900K', 'High-performance CPU for gaming and productivity', 499.99, 'https://picsum.photos/seed/picsum/200/300'],
        ['NVIDIA GeForce RTX 3080', 'Powerful GPU for gaming and rendering', 699.99, 'https://picsum.photos/seed/picsum/200/300'],
        ['Corsair Vengeance RGB Pro 16GB (2 x 8GB)', 'DDR4 RAM with RGB lighting for enhanced aesthetics', 99.99, 'https://picsum.photos/seed/picsum/200/300'],
        ['Samsung 970 EVO Plus 1TB NVMe SSD', 'Fast NVMe SSD for storage and boot drive', 149.99, 'https://picsum.photos/seed/picsum/200/300'],
        ['ASUS ROG Strix Z390-E Gaming', 'High-end motherboard with RGB lighting and advanced features', 259.99, 'https://picsum.photos/seed/picsum/200/300']
    ];
    
    const insertQuery = 'INSERT INTO products (product_name, description, price, image) SELECT * FROM (SELECT ?, ?, ?, ?) AS tmp WHERE NOT EXISTS (SELECT product_name FROM products WHERE product_name = ?) LIMIT 1';
    
    products.forEach(product => {
        const [productName, description, price, image] = product;
        data.query(insertQuery, [productName, description, price, image, productName], (err, result) => {
            if (err) {
                console.error('Error inserting initial products data:', err);
                return;
            }
            console.log('Initial products data inserted successfully');
        });
    });
}
function initializeUsers() {
    const users = [
        ['john_doe', 'john@example.com', 'password123', '123 Main St, City, Country'],
        ['jane_smith', 'jane@example.com', 'password456', '456 Elm St, City, Country']
    ];
    
    const insertQuery = 'INSERT INTO users (username, email, password, address) SELECT * FROM (SELECT ?) AS tmp WHERE NOT EXISTS (SELECT username FROM users WHERE username = ?) LIMIT 1';
    
    users.forEach(user => {
        data.query(insertQuery, [user, user[0]], (err, result) => {
            if (err) {
                console.error('Error inserting initial users data:', err);
                return;
            }
            console.log('Initial users data inserted successfully');
        });
    });
}
app.use(express.json());
app.use(cors());

//**********************************Products GET Method*******************************
app.get('/products', (req, res) => {
    data.query('SELECT * FROM products', (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

app.get('/products/:id', (req, res) => {
    const productId = req.params.id;
    data.query('SELECT * FROM products WHERE product_id = ?', productId, (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(results[0]);
    });
});

app.post('/products', (req, res) => {
    const newProduct = req.body;
    data.query('INSERT INTO products SET ?', newProduct, (err, result) => {
        if (err) throw err;
        res.status(201).send('Product added successfully');
    });
});

app.patch('/products/:id', (req, res) => {
    const productId = req.params.id;
    const updatedProduct = req.body;
    data.query('UPDATE products SET ? WHERE product_id = ?', [updatedProduct, productId], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.send('Product updated successfully');
    });
});

app.delete('/products/:id', (req, res) => {
    const productId = req.params.id;
    data.query('DELETE FROM products WHERE product_id = ?', productId, (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.send('Product deleted successfully');
    });
});

//*******************************Users GET Method*******************************
app.get('/users', (req, res) => {
    data.query('SELECT * FROM users', (err, results) => {
        if (err) {
            console.error('Error fetching products:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

app.get('/users/:id', (req, res) => {
    const userId = req.params.id;
    data.query('SELECT * FROM users WHERE user_id = ?', userId, (err, results) => {
        if (err) {
            console.error('Error fetching product:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.length === 0) {
            res.status(404).json({ error: 'Product not found' });
            return;
        }
        res.json(results[0]);
    });
});

app.post('/users', (req, res) => {
    const newUser = req.body;
    data.query('INSERT INTO users SET ?', newUser, (err, result) => {
        if (err) {
            console.error('Error adding user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.status(201).send('User added successfully');
    });
});

app.patch('/users/:id', (req, res) => {
    const userId = req.params.id;
    const updatedUser = req.body;
    data.query('UPDATE users SET ? WHERE user_id = ?', [updatedUser, userId], (err, result) => {
        if (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.send('User updated successfully');
    });
});

app.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    data.query('DELETE FROM users WHERE user_id = ?', userId, (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.send('User deleted successfully');
    });
});

//********************************Orders GET Method*******************************
app.get('/orders', (req, res) => {
    data.query('SELECT * FROM orders', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    data.query('SELECT * FROM orders WHERE order_id = ?', orderId, (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.post('/orders', (req, res) => {
    const newOrder = req.body;
    data.query('INSERT INTO products SET ?', newOrder, (err, result) => {
        if (err) throw err;
        res.status(201).send('Order added successfully');
    });
});

app.patch('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    const updatedOrder = req.body;
    data.query('UPDATE orders SET ? WHERE order_id = ?', [updatedOrder, orderId], (err, result) => {
        if (err) throw err;
        res.send('Order updated successfully');
    });
});

app.delete('/orders/:id', (req, res) => {
    const orderId = req.params.id;
    data.query('DELETE FROM orders WHERE order_id = ?', orderId, (err, result) => {
        if (err) throw err;
        res.send('Product deleted successfully');
    });
});

//*************************************Order Items GET Method*******************************
app.get('/order_items', (req, res) => {
    data.query('SELECT * FROM order_items', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});

app.get('/order_items/:id', (req, res) => {
    const itemId = req.params.id;
    data.query('SELECT * FROM order_items WHERE order_item_id = ?', itemId, (err, results) => {
        if (err) throw err;
        res.json(results[0]);
    });
});

app.post('/order_items', (req, res) => {
    const newItem = req.body;
    data.query('INSERT INTO order_items SET ?', newItem, (err, result) => {
        if (err) throw err;
        res.status(201).send('Item added successfully');
    });
});

app.patch('/order_items/:id', (req, res) => {
    const itemId = req.params.id;
    const updatedItem = req.body;
    data.query('UPDATE products SET ? WHERE order_item_id = ?', [updatedItem, itemId], (err, result) => {
        if (err) throw err;
        res.send('Item updated successfully');
    });
});

app.delete('/order_items/:id', (req, res) => {
    const itemId = req.params.id;
    data.query('DELETE FROM order_items WHERE order_item_id = ?', itemId, (err, result) => {
        if (err) throw err;
        res.send('item deleted successfully');
    });
});
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    // Query to fetch the user from the database based on the provided username
    const query = 'SELECT * FROM users WHERE username = ?';
    data.query(query, [username], async (err, results) => {
      if (err) {
        console.error('Error querying database:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (results.length === 0) {
        // If no user found with the provided username
        return res.status(401).json({ error: 'Invalid username or password' });
      }
  
      const user = results[0];
      // Compare the password provided by the user with the hashed password stored in the database
      const passwordMatch = await bcrypt.compare(password, user.password);
  
      if (!passwordMatch) {
        // If passwords don't match
        return res.status(401).json({ error: 'Invalid username or password' });
      }
  
      // If username and password are correct, generate a token or session and send it back to the client
      // You can also send back the user data if needed
      res.status(200).json({ token: 'your_generated_token', user });
    });
  });
app.listen(8080);