import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const dynamic = 'force-static'

const skillDir = resolve(process.cwd(), '../../skills/tourlight')
const references = ['api.md', 'troubleshooting.md', 'tour-documents.md']

// SKILL.md links to references/*.md by relative path.
// Append them so readers of this URL get the whole skill.
export function GET() {
  const parts = [readFileSync(resolve(skillDir, 'SKILL.md'), 'utf8')]
  for (const file of references) {
    const body = readFileSync(resolve(skillDir, 'references', file), 'utf8')
    parts.push(`\n---\n\n<!-- references/${file} -->\n\n${body}`)
  }
  return new Response(parts.join(''), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  })
}
