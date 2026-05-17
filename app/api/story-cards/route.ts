import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const JSON_PATH = path.join(process.cwd(), 'lib', 'data', 'storyCards.json');

function devOnly() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const guard = devOnly();
  if (guard) return guard;

  const raw = await fs.readFile(JSON_PATH, 'utf-8');
  return NextResponse.json(JSON.parse(raw));
}

export async function PUT(request: Request) {
  const guard = devOnly();
  if (guard) return guard;

  const body = await request.json();
  if (!Array.isArray(body)) {
    return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  }

  await fs.writeFile(JSON_PATH, JSON.stringify(body, null, 2), 'utf-8');
  return NextResponse.json({ ok: true });
}
