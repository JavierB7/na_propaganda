import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  // Next genera AGENTS.md y CLAUDE.md con sus propias reglas. CLAUDE.md es un
  // archivo del repositorio, no del framework: se deja al criterio de quien
  // trabaja acá.
  agentRules: false,
}

export default nextConfig
