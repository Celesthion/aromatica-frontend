// Metro смотрит и в mobile/, и в корень репозитория: оттуда мобилка берёт
// логику кассы (pages/pos/lib), деньги и api-клиент.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const repoRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

config.watchFolders = [repoRoot]
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')]
// Корневые node_modules веба прячем: там react 18, а RN нужен react 19, и две
// копии в одном бандле ломают хуки. Вложенные (expo/node_modules и т.п.) оставляем,
// иначе не найдётся expo-modules-core.
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
config.resolver.blockList = [
  new RegExp(`^${escape(path.join(repoRoot, 'node_modules'))}${escape(path.sep)}.*`),
]

// Модули веба, у которых на мобильном своя реализация (import.meta.env и т.п.).
const OVERRIDES = {
  '@/shared/api/http': path.resolve(projectRoot, 'src/compat/http.ts'),
}

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const override = OVERRIDES[moduleName]
  if (override) return context.resolveRequest(context, override, platform)
  // '@/...' - исходники веба, '~/...' - мобилки
  if (moduleName.startsWith('@/'))
    return context.resolveRequest(context, path.join(repoRoot, 'src', moduleName.slice(2)), platform)
  if (moduleName.startsWith('~/'))
    return context.resolveRequest(context, path.join(projectRoot, 'src', moduleName.slice(2)), platform)
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
