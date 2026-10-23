import { defineConfig } from 'astro/config';

export default defineConfig({
  // set to your domain before deploying, e.g. 'https://pikionis.com'
  site: 'https://pikionis.com',
  // the dev toolbar sits bottom-centre, right where the status island lives on /contact
  devToolbar: { enabled: false },
});
