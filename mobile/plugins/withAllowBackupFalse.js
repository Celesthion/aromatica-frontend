const { withAndroidManifest } = require('expo/config-plugins')

/**
 * Ставит android:allowBackup="false" в манифесте.
 *
 * Иначе Auto Backup и `adb backup` вытаскивают песочницу приложения
 * (AsyncStorage, а без аппаратного хранилища и SecureStore) с телефона без root.
 * Кассе бэкап не нужен: данные живут на сервере.
 *
 * expo-build-properties такого флага не знает, а ручную правку в /android
 * затирает prebuild, поэтому нужен плагин.
 */
module.exports = function withAllowBackupFalse(config) {
  return withAndroidManifest(config, (cfg) => {
    const app = cfg.modResults.manifest.application?.[0]
    if (app) {
      app.$['android:allowBackup'] = 'false'
    }
    return cfg
  })
}
