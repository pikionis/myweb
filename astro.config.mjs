import { defineConfig } from 'astro/config';

export default defineConfig({
  // the live domain (GitHub Pages, see .github/workflows/deploy.yml)
  site: 'https://onehublabs.com',
  // the dev toolbar sits bottom-centre, right where the status island lives on /contact
  devToolbar: { enabled: false },
});
