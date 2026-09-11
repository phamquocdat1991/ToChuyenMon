import {readFile} from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before applying the database schema.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
try{await client.connect();await client.query(await readFile(new URL('../db/postgres.sql',import.meta.url),'utf8'));console.log('Database schema ready.');}finally{await client.end();}
