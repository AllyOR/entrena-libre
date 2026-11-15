import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  // The store identifier. It cannot change once the app is published: decide it before the first upload.
  appId: 'com.trainingseasonny.app',
  appName: 'Training Seasonny',
  // The web build the native shells embed. Build it with `npm run build:native`.
  webDir: 'dist',
}

export default config
