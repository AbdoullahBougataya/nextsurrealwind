import Surreal from 'surrealdb.js';

export const getSurrealClient = async () => {
  const db = new Surreal('http://127.0.0.1:8080/rpc');
  await db.signin({
    user: 'root',
    pass: 'root',
  });
  await db.use('namespace', 'database');
  return db;
};
