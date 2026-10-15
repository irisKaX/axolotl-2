# QR Code generator — Project Nayuki, v1.8.0

Source: https://github.com/nayuki/QR-Code-generator/releases/tag/v1.8.0

Bundled upstream asset: `qrcodegen-v1.8.0-es6.js`

Download: https://github.com/nayuki/QR-Code-generator/releases/download/v1.8.0/qrcodegen-v1.8.0-es6.js

Original SHA-256: `6a1116192ed1dd67fa1bf31e77f5817103d71c23bbac24c382e698b7668bdd01`

License: MIT, included verbatim in the header of `qrcodegen.js`.

Only local adaptation: append `export {qrcodegen};` to expose the upstream namespace as a native ES module. No runtime build, network access or external dependency.

Documentation: https://www.nayuki.io/page/qr-code-generator-library

To update, download and verify the upstream release, retain its license, append the ES module export and run `npm test` plus `npm run test:qr`. jsQR is an independent, test-only decoder installed by `npm ci`; it is not loaded by the extension.
