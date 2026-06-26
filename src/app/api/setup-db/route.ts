import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: Request) {
  try {
    const { secret, sqlQuery } = await request.json();

    if (secret !== 'antigravity_secret_123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the pooler (transaction mode) connection string for Vercel compatibility
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.vwvqrzhpzpetsdrkslse:GjESmkGBZP4h8DkL@aws-0-us-east-1.pooler.supabase.com:6543/postgres';
    const sql = postgres(connectionString, { ssl: 'require' });

    console.log('Executing query...');
    await sql.unsafe(sqlQuery);
    console.log('Query executed successfully');

    await sql.end();

    return NextResponse.json({ success: true, message: 'Query executed correctly.' });
  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
