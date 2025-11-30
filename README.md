# Zimpricecheck Forex Calculator

A premium, responsive Forex Calculator Vue.js application designed for integration into WordPress. It features real-time exchange rates, a clean UI inspired by XE.com, and specific handling for the Zimbabwe Gold (ZiG) currency.

## Features

- **Real-time Rates**: Fetches live exchange rates for ZiG and global currencies.
- **Premium UI**: Clean, modern interface using Tailwind CSS and DaisyUI, with "Brand Orange" accents.
- **ZiG Integration**: Specialized handling for ZiG, including Buy/Sell rates and Cash Value calculations.
- **Business Rates**: Displays live rates from popular Zimbabwean businesses (OK, Pick n Pay, etc.) with logos.
- **Smart Inputs**: Dynamic input padding based on currency symbol length.
- **Pluralization**: Intelligent currency name pluralization (e.g., "10 US Dollars" vs "1 US Dollar").
- **WordPress Ready**: Scoped CSS (`#zp-fx-calc`) to prevent style conflicts when embedded in WordPress.

## Tech Stack

- **Vue 3**: Composition API, `<script setup>`.
- **Vite**: Fast build tool.
- **Pinia**: State management.
- **Tailwind CSS**: Utility-first CSS framework.
- **DaisyUI**: Component library for Tailwind.
- **PostCSS**: Used for scoping styles.

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Configuration**:
    Copy `.env.sample` to `.env` and configure your API URL if needed.
    ```bash
    cp .env.sample .env
    ```
    
    *Note: The application defaults to `https://api.clientemails.xyz/api` if no env var is set.*

3.  **Run Development Server**:
    ```bash
    npm run dev
    ```

4.  **Build for Production**:
    ```bash
    npm run build
    ```
    
    **Important**: By default, Vite builds to the `dist/` directory. 
    
    If you are integrating this into a specific WordPress plugin, you should configure the `outDir` in `vite.config.js` to point to your plugin's assets folder (e.g., `/path/to/wp-content/plugins/my-plugin/assets/fx-calc`).
    
    Example `vite.config.js`:
    ```js
    export default defineConfig({
      plugins: [vue()],
      base: '/wp-content/plugins/api-vuejs/assets/fx-calc/', // Ensure this matches your plugin path
      build: {
        outDir: '/absolute/path/to/your/plugin/assets/fx-calc',
        emptyOutDir: true,
        // ...
      }
    })
    ```

## WordPress Integration

The build is configured to output assets that can be enqueued in a WordPress plugin. Ensure your WordPress page has a container with the ID `zp-fx-calc`:

```html
<div id="zp-fx-calc"></div>
```

## License

Proprietary.
