import { NextResponse } from 'next/server';
import postgres from 'postgres';

export async function POST(request: Request) {
  try {
    const { secret, sqlQuery } = await request.json();

    if (secret !== 'antigravity_secret_123') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const connectionString = 'postgresql://postgres:GjESmkGBZP4h8DkL@db.vwvqrzhpzpetsdrkslse.supabase.co:5432/postgres';
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
