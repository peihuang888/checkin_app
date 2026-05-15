# 微信打卡助手 - Android APK 构建指南

## 快速开始

本项目已配置好 Capacitor，只需以下步骤即可构建 APK：

### 环境要求

- **Node.js** >= 18.0
- **Java** >= 17 (OpenJDK)
- **Android SDK** (通过 Android Studio 安装)

### 安装依赖

```bash
# 1. 安装项目依赖
npm install

# 2. 确保 Capacitor 依赖已安装（已包含在 package.json 中）
# @capacitor/core, @capacitor/cli, @capacitor/android
```

### 构建 APK

```bash
# 1. 构建前端代码
npm run build:client

# 2. 同步资源到 Android 项目
npx cap sync android

# 3. 构建 Debug APK
cd android && ./gradlew assembleDebug
```

构建完成后，APK 文件位于：
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### 安装到手机

1. 将 `app-debug.apk` 文件传输到 Android 手机
2. 在手机上找到 APK 文件并点击安装
3. 如提示"未知来源应用"，请在设置中允许安装
4. 安装完成后，桌面上会出现"微信打卡助手"应用图标

---

## 项目结构说明

### Capacitor 配置 (`capacitor.config.ts`)

```typescript
{
  appId: 'com.checkin.app',      // 应用包名
  appName: '微信打卡助手',        // 应用显示名称
  webDir: 'dist/client',          // Web 构建输出目录
  server: {
    androidScheme: 'https',       // Android URL Scheme
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,   // 启动画面显示时长（毫秒）
      backgroundColor: '#FF6B4A', // 启动画面背景色（珊瑚橙）
    },
  },
}
```

### Android 项目结构

```
android/
├── app/
│   ├── src/main/
│   │   ├── assets/public/     # Web 资源（自动同步）
│   │   ├── res/               # 资源文件
│   │   │   ├── mipmap-*/      # 应用图标（各尺寸）
│   │   │   └── values/        # 颜色、字符串等
│   │   └── AndroidManifest.xml # 应用配置
│   └── build.gradle           # 构建配置
└── gradlew                    # Gradle 包装器
```

---

## 自定义配置

### 修改应用图标

1. 准备 1024x1024 像素的 PNG 图标
2. 替换以下位置的图标文件：
   - `android/app/src/main/res/mipmap-mdpi/ic_launcher.png` (48x48)
   - `android/app/src/main/res/mipmap-hdpi/ic_launcher.png` (72x72)
   - `android/app/src/main/res/mipmap-xhdpi/ic_launcher.png` (96x96)
   - `android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png` (144x144)
   - `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png` (192x192)

或使用自动工具：
```bash
npm install -D @capacitor/assets
npx capacitor-assets generate
```

### 修改应用名称

编辑 `capacitor.config.ts` 中的 `appName` 字段，然后重新同步：
```bash
npx cap sync android
```

### 修改包名

编辑 `capacitor.config.ts` 中的 `appId` 字段，然后重新添加平台：
```bash
npx cap rm android
npx cap add android
```

---

## Release 构建（正式发布）

如需发布到应用市场，需要构建 Release 版本并签名：

```bash
# 1. 构建 Release APK
cd android && ./gradlew assembleRelease

# 2. 生成签名密钥（只需执行一次）
keytool -genkey -v -keystore my-release-key.keystore -alias alias_name -keyalg RSA -keysize 2048 -validity 10000

# 3. 签名 APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore app-release-unsigned.apk alias_name

# 4. 对齐优化
zipalign -v 4 app-release-unsigned.apk 微信打卡助手-release.apk
```

---

## 常见问题

### 1. 构建失败：JAVA_HOME 未设置

**解决**: 设置 JAVA_HOME 环境变量
```bash
# macOS (bash)
export JAVA_HOME=$(/usr/libexec/java_home -v 17)

# Ubuntu/Debian
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# Windows (PowerShell)
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
```

### 2. Android SDK 未找到

**解决**: 安装 Android Studio 并设置环境变量
```bash
# macOS
export ANDROID_SDK_ROOT=$HOME/Library/Android/sdk

# Linux
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
```

### 3. 应用安装后白屏

**可能原因**: 
- Web 资源未正确同步：运行 `npx cap sync android`
- 路由问题：当前使用 BrowserRouter，如遇到问题可切换为 HashRouter

### 4. 图标未更新

**解决**: 清除构建缓存后重新构建
```bash
cd android && ./gradlew clean
npm run build:client
npx cap sync android
./gradlew assembleDebug
```

---

## 开发调试

### 使用 Android Studio 调试

```bash
# 打开 Android Studio
npx cap open android
```

然后在 Android Studio 中：
1. 连接 Android 手机（开启开发者模式和 USB 调试）
2. 点击"Run"按钮（绿色三角形）
3. 应用将自动安装并在手机上启动
4. 可在 Chrome DevTools 中调试 WebView：`chrome://inspect/#devices`

### 实时重载（开发模式）

如需在开发时实时查看更改：

```bash
# 1. 启动前端开发服务器
npm run dev:client

# 2. 在 capacitor.config.ts 中启用服务器 URL
server: {
  url: 'http://YOUR_IP:3000',
  cleartext: true,
}

# 3. 同步并运行
npx cap sync android
cd android && ./gradlew installDebug
```

---

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **移动端封装**: Capacitor 6
- **UI 组件**: shadcn/ui + Tailwind CSS
- **状态管理**: LocalStorage (客户端)

---

## 更多资源

- [Capacitor 官方文档](https://capacitorjs.com/docs)
- [Android 开发者指南](https://developer.android.com/guide)
- [React 文档](https://react.dev/)
