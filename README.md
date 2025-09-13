# pchj.github.io

Disparity feels like motion that isn't evenly shared. Heavy facts, deadlines, and priorities act like weight, pulling nearby paths while things farther away drift more freely. A small push near that weight can change direction a lot, while far away the pull fades. The visual is simple and steady, but it shows imbalance as curves and shifts in speed. By adjusting the weight, I can see how focus, bias, or workload changes the flow. It's a clear way to show uneven influence: when disparity grows, the grid bends and paths warp. In the end, it's also a cheap reminder of the steady patterns of professional life. 

(No this means absolutely nothing, I'm just learning front end development.)

## Architecture

This portfolio site features a modular TypeScript architecture with an interactive 3D galaxy visualization built using Three.js. The application is structured as follows:

### Project Structure

```
src/
├── components/
│   ├── certifications/CertificationsToggle.ts  # Certification section toggle
│   ├── cards/CardExpand.ts                      # Expandable card interactions
│   ├── panel/PanelClouds.ts                     # Control panel and cloud effects
│   └── quality/Settings.ts                     # Quality settings management
├── three/
│   ├── ThreeSetup.ts                           # Three.js renderer setup
│   ├── Nebula.ts                               # Nebula shader effect
│   ├── Starfield.ts                            # Background starfield
│   ├── Galaxy.ts                               # Interactive galaxy particles
│   ├── Halo.ts                                 # Cursor halo effect
│   └── SceneBuilder.ts                         # Scene coordination
├── canvas/
│   ├── Layout.ts                               # Canvas layout management
│   └── FieldGrid.ts                            # 2D flow field and grid
├── controls/
│   └── Controls.ts                             # User input handling
├── types/
│   └── global.d.ts                             # TypeScript type definitions
└── main.ts                                     # Application entry point
```

### Key Features

- **Modular TypeScript Architecture**: Clean separation of concerns with type safety
- **Three.js 3D Graphics**: Interactive galaxy with nebula, starfield, and particle systems
- **2D Canvas Effects**: Flow field visualization and distorted grid overlay
- **Responsive Design**: Adaptive quality settings based on device capabilities
- **Performance Optimization**: Quality levels from low to ultra for various devices

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test
```

## Alpha Legacy Build

The original monolithic JavaScript implementation is preserved as `app.legacy.js` for backward compatibility during the TypeScript modular refactor.

### Using the Legacy Version

To switch back to the legacy implementation:

1. Open `index.html`
2. Replace the current script tag:
   ```html
   <script type="module" src="/src/main.ts"></script>
   ```
   with:
   ```html
   <script type="module" src="app.legacy.js"></script>
   ```

The legacy version maintains the same functionality as the original app.js but is kept as an alpha release for reference and compatibility purposes.