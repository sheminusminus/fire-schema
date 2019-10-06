require('dotenv').config();
const admin = require('firebase-admin');

const fullData = require('./data');


admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: process.env.DB_URL,
});

process.nextTick(async () => {
  await admin.database().ref().set(fullData);
  process.exit(0);
});
