# Axis Mobile App 🛒

A React Native mobile marketplace app built with Expo, designed for school communities to buy and sell items easily.

![Expo](https://img.shields.io/badge/Expo-54.0.0-blue)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-61DAFB)
![License](https://img.shields.io/badge/license-MIT-green)

## 📱 Features

- **Beautiful Landing Page** - Modern purple-themed UI with custom header image and logo
- **User Authentication Flow** - Sign in screen with email and password inputs
- **Custom Typography** - Hammersmith One Google Font for consistent branding
- **Responsive Design** - Optimized for both iOS and Android devices
- **Smooth Navigation** - Seamless transitions between screens
- **Interactive Elements** - Touch-responsive buttons with visual feedback

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v20.19.4 or newer recommended)
- **npm** or **yarn**
- **Expo Go** app on your mobile device
  - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
  - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ronit567/Axis.git
cd Axis
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

### Running on Your Device

#### Option 1: Using Expo Go (Recommended)
1. Run `npm start`
2. Scan the QR code with:
   - **iOS**: Camera app (points to Expo Go automatically)
   - **Android**: Expo Go app's built-in scanner
3. The app will load on your device

#### Option 2: Using Simulators/Emulators
- **iOS Simulator**: `npm run ios` (requires macOS with Xcode)
- **Android Emulator**: `npm run android` (requires Android Studio)
- **Web Browser**: `npm run web`

## 🎨 Design

The app features a modern, clean design with:
- **Primary Color**: Purple (#4b307d)
- **Header**: Curved bottom edges for a modern look
- **Logo**: Centered circular badge overlapping the header
- **Typography**: Hammersmith One font for branding consistency
- **Layout**: Clean white background with strategic purple accents

## 📁 Project Structure

```
axis-mobile-app/
├── App.js              # Main app component with navigation logic
├── images/             # Image assets
│   ├── header.png      # Header background image
│   ├── logo.png        # App logo
│   └── grey_circle.png # Circle background for logo
├── app.json            # Expo configuration
├── package.json        # Dependencies and scripts
├── babel.config.js     # Babel configuration
├── .gitignore          # Git ignore rules
└── README.md           # This file
```

## 🛠️ Technologies Used

- **React Native** - Mobile app framework
- **Expo** - Development platform and tooling
- **Expo Font** - Custom font loading
- **Expo Google Fonts** - Hammersmith One typography
- **React Hooks** - State management (useState)

## 📝 Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android emulator
- `npm run ios` - Run on iOS simulator
- `npm run web` - Run in web browser

## 🔧 Configuration

The app is configured for:
- **Expo SDK**: 54.0.0
- **React**: 19.1.0
- **React Native**: 0.81.5
- **Bundle Identifier (iOS)**: com.axis.mobileapp
- **Package Name (Android)**: com.axis.mobileapp

## 📱 Screens

### Home Screen
- App logo and branding
- Tagline: "Shop and sell easily—just for your school community"
- Sign in button
- Create account button

### Sign In Screen
- Email address input field
- Password input field (secure)
- Back button (returns to home)
- Continue button (for authentication)

## 🐛 Troubleshooting

### App won't load on device
- Make sure your phone and computer are on the same WiFi network
- Try clearing Expo cache: `npx expo start --clear`
- Restart the Expo Go app

### Font not loading
- Run `npm install` to ensure all dependencies are installed
- Clear cache and restart: `npx expo start --clear`

### SDK version mismatch
- Update Expo Go to the latest version on your device
- Run `npx expo install --fix` to fix package versions

