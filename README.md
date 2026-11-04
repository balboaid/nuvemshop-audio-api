# DJ Vinyl Store

DJ Vinyl Store is a web-based audio preview management system integrated with the Nuvemshop e-commerce platform. It enables administrators to manage audio previews associated with individual products through a dedicated administration interface.

## Features

- **Product Integration:** Identifies products using their Nuvemshop product IDs.
- **Audio Preview Management:** Associates audio tracks with specific products.
- **Administration Panel:** Provides an interface to create, edit, retrieve, and delete audio preview records.
- **REST API:** Handles audio preview data and product-specific requests.
- **Product Page Integration:** Displays tracklists and an integrated audio player directly on product pages.
- **Cloud Storage:** Uses Cloudflare R2 for audio file storage.
- **Database Management:** Stores preview metadata using Cloudflare D1.

## Technology Stack

- JavaScript
- HTML5
- CSS3
- Cloudflare Workers
- Cloudflare D1
- Cloudflare R2
- Wrangler
- REST API
- Nuvemshop integration

## Architecture

The application uses Cloudflare Workers as its backend API, Cloudflare D1 for structured data storage, and Cloudflare R2 for audio assets. The administration interface communicates with the API to manage preview records, while the Nuvemshop storefront retrieves and displays the corresponding audio previews on product pages.
