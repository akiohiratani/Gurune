import react from '@vitejs/plugin-react'
import { readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const virtualWinMoviesId = 'virtual:win-movies'
const resolvedVirtualWinMoviesId = `\0${virtualWinMoviesId}`
const winMoviesDirectory = resolve(process.cwd(), 'public/movie/win')

function getWinMoviePaths(): string[] {
  return readdirSync(winMoviesDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.mp4'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((fileName) => `/movie/win/${encodeURIComponent(fileName)}`)
}

function winMoviesPlugin(): Plugin {
  return {
    name: 'win-movies',
    resolveId(id) {
      if (id === virtualWinMoviesId) return resolvedVirtualWinMoviesId
    },
    load(id) {
      if (id === resolvedVirtualWinMoviesId) {
        return `export default ${JSON.stringify(getWinMoviePaths())}`
      }
    },
    configureServer(server) {
      server.watcher.add(winMoviesDirectory)

      const refreshWinMovies = (filePath: string) => {
        if (
          dirname(resolve(filePath)) === winMoviesDirectory &&
          filePath.toLowerCase().endsWith('.mp4')
        ) {
          const module = server.moduleGraph.getModuleById(resolvedVirtualWinMoviesId)
          if (module) server.moduleGraph.invalidateModule(module)
          server.ws.send({ type: 'full-reload' })
        }
      }

      server.watcher.on('add', refreshWinMovies)
      server.watcher.on('unlink', refreshWinMovies)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [winMoviesPlugin(), react()],
})
