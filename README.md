# Rechtspraak AI

AI-powered Dutch legal case search and analysis desktop application.

## Build as Windows App

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)

### Steps

1. Download and unzip the project.
2. Open a terminal in the project folder.
3. Install dependencies:
   ```
   npm install
   ```
4. Build the Windows installer:
   ```
   npm run dist:win
   ```
5. Find the installer in the `release/` folder — it will be named `Rechtspraak AI Setup 1.0.0.exe`.

Double-click the installer to install the app on any Windows computer.

### Other Platforms

- macOS: `npm run dist:mac`
- Linux: `npm run dist:linux`

### Development

Run the app in development mode with hot reload:
```
npm run electron:dev
```
