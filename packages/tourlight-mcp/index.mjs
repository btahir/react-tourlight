#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio'
import { createTourlightServer } from './server.mjs'

const server = createTourlightServer()
await server.connect(new StdioServerTransport())
