import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Read .env.local manually since we might not have dotenv loaded for this script
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Simple parser for .env file
const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        env[key] = value;
    }
});

const connectionString = env.POSTGRES_URL;

if (!connectionString) {
    console.error('POSTGRES_URL not found in .env.local');
    process.exit(1);
}

const client = new pg.Client({
    connectionString: connectionString.replace('sslmode=require', ''),
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to database...');

        const sql = `
      create table if not exists public.estudiantes (
        id text primary key,
        materias jsonb,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null
      );

      alter table public.estudiantes enable row level security;

      -- Drop policies if they exist to avoid errors on re-run
      drop policy if exists "Enable read access for all users" on public.estudiantes;
      drop policy if exists "Enable insert/update access for all users" on public.estudiantes;
      drop policy if exists "Enable update access for all users" on public.estudiantes;

      create policy "Enable read access for all users" on public.estudiantes for select using (true);
      create policy "Enable insert/update access for all users" on public.estudiantes for insert with check (true);
      create policy "Enable update access for all users" on public.estudiantes for update using (true);
    `;

        await client.query(sql);
        console.log('Table "estudiantes" created successfully!');

    } catch (err) {
        console.error('Error creating table:', err);
    } finally {
        await client.end();
    }
}

run();
