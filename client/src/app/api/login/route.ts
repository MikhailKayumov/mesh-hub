import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import Api from '~/api/Api';

export async function POST(request: NextRequest) {
  const data = await request.json();
  const res = await Api.auth.login(data);

  revalidatePath('/');

  return NextResponse.json(res);
}
