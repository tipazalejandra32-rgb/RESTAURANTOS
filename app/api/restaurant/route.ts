import { NextResponse } from 'next/server'
import { applyRestaurantAction, getRestaurantState } from '@/lib/server/restaurant-mysql'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const state = await getRestaurantState()
    return NextResponse.json(state)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { action?: string; payload?: unknown }
    if (!body.action) {
      return NextResponse.json({ ok: false, error: 'Falta action' }, { status: 400 })
    }
    const result = await applyRestaurantAction(body.action, body.payload)
    return NextResponse.json({
      ok: true,
      state: result.state,
      newOrderId: result.newOrderId,
      newInvoiceId: result.newInvoiceId,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
