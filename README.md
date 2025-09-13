# pchj.github.io

Disparity feels like motion that isn't evenly shared. Heavy facts, deadlines, and priorities act like weight, pulling nearby paths while things farther away drift more freely. A small push near that weight can change direction a lot, while far away the pull fades. The visual is simple and steady, but it shows imbalance as curves and shifts in speed. By adjusting the weight, I can see how focus, bias, or workload changes the flow. It's a clear way to show uneven influence: when disparity grows, the grid bends and paths warp. In the end, it's also a cheap reminder of the steady patterns of professional life. 

(No this means absolutely nothing, I'm just learning front end development.)

## Architecture

This portfolio site has been refactored from a monolithic JavaScript file into a modern TypeScript codebase with modular architecture.

### Technology Stack

- **TypeScript**: Strict type checking with ES2020 target
- **Vite**: Modern build tool for fast development and optimized production builds
- **Three.js**: 3D graphics library for galaxy visualization
- **Vitest**: Unit testing framework
- **CSS3**: Modern styling with custom properties and grid layouts

### Project Structure

```
src/
├── components/
│   ├── certifications/CertificationsToggle.ts  # Certification section toggle
│   ├── cards/CardExpand.ts                    # Interactive card expansion
│   ├── panel/PanelClouds.ts                   # Galaxy controls panel & clouds
│   └── quality/Settings.ts                    # Quality auto-detection & settings
├── three/
│   ├── ThreeSetup.ts                          # WebGL renderer & camera setup
│   ├── Nebula.ts                              # Procedural nebula background
│   ├── Starfield.ts                           # Twinkling background stars
│   ├── Galaxy.ts                              # Main interactive galaxy spiral
│   ├── Halo.ts                                # Mouse cursor particle effect
│   └── SceneBuilder.ts                        # Scene orchestration & rebuilding
├── canvas/
│   ├── Layout.ts                              # Viewport management & resizing
│   └── FieldGrid.ts                           # 2D flow field & distorted grid
├── controls/
│   └── Controls.ts                            # DOM slider bindings
└── main.ts                                    # Application entry point
```

### Features

- **Interactive Galaxy**: 50,000+ particles with orbital dynamics and gravitational mouse interaction
- **Quality Auto-Detection**: Automatically adjusts rendering quality based on device capabilities
- **Responsive Design**: Adapts to different screen sizes and device pixel ratios
- **Accessibility**: Proper ARIA labels, keyboard navigation, and reduced motion support
- **Performance Optimized**: Efficient WebGL shaders and canvas 2D operations

### Development Commands

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
npm test

# Run tests with UI
npm run test:ui
```

### Quality Settings

The application automatically detects device capabilities and adjusts rendering quality:

- **Ultra**: 50K stars, high-res effects (8GB+ RAM, high DPR, desktop)
- **High**: 32K stars, enhanced shaders (6GB+ RAM, desktop)
- **Medium**: 13K stars, standard quality (4GB RAM or mobile)
- **Low**: 8K stars, minimal effects (low-end devices)

### Browser Support

- Modern browsers with WebGL support
- ES2020+ JavaScript features
- CSS custom properties and grid layout
- Pointer events API

### Performance Notes

- WebGL shaders preserved verbatim from original implementation
- Instanced rendering for galaxy particles
- Efficient 2D canvas operations with proper frame rate limiting
- Memory-conscious particle system scaling based on device capabilities