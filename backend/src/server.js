const { createApp } = require('./app');
const { openDatabase } = require('./db');

const PORT = process.env.PORT || 3001;
const db = openDatabase();

createApp(db)
  .then(app => {
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to start backend server:', err);
    process.exit(1);
  });
