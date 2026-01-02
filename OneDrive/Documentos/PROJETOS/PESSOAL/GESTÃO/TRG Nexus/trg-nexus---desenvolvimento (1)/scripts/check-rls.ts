import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const connectionString = process.env.POSTGRES_URL;

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        console.log('Querying RLS Policies for "therapists"...');

        const res = await client.query(`
      SELECT policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies 
      WHERE tablename = 'therapists';
    `);

        console.log('\n--- RLS POLICIES ---');
        res.rows.forEach(row => {
            console.log(`Policy: ${row.policyname}`);
            console.log(`  Permissive: ${row.permissive}`);
            console.log(`  Roles: ${row.roles}`);
            console.log(`  Cmd: ${row.cmd}`);
            console.log(`  Qual (USING): ${row.qual}`);
            console.log(`  Check (WITH CHECK): ${row.with_check}`);
            console.log('---');
        });

        client.release();
    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

run();
