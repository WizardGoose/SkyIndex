import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const modDir = join(import.meta.dirname, '..', 'mod')
const wrapper = process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'
const wrapperPath = join(modDir, wrapper)

if (!existsSync(wrapperPath)) {
  throw new Error(`Fabric Gradle wrapper is missing: ${wrapperPath}`)
}

const command = process.platform === 'win32' ? 'cmd.exe' : wrapperPath
const args = process.platform === 'win32'
  ? ['/d', '/s', '/c', wrapper, 'build']
  : ['build']
const result = spawnSync(command, args, {
  cwd: modDir,
  stdio: 'inherit',
  shell: false,
})

if (result.error) throw result.error
process.exit(result.status ?? 1)