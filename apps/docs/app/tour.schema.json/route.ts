import schema from 'react-tourlight/schema.json'

export const dynamic = 'force-static'
export function GET() {
  return Response.json(schema, { headers: { 'Cache-Control': 'public, max-age=3600' } })
}
