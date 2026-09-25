import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  output: 'standalone',
  devIndicators: false,
}

export default withMDX(config)
