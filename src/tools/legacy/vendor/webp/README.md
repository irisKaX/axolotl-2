# Bundled WebP encoder

`webp_codec.wasm` is copied unchanged from the installed Playwright Core 1.62.1 distribution, `lib/webp_codec.wasm`. It provides libwebp encoding and decoding with an Emscripten runtime. The app uses only RGBA encoding. It loads the local packaged file, with no CDN or runtime downloads.

Source provenance: https://github.com/microsoft/playwright/tree/main/packages/utils/webp
Codec upstream: https://github.com/webmproject/libwebp

SHA-256: `164cd9583a3e4d081f767d3b41ff0a730443dc7535fcc5caff83561463384b79`

The binary's accompanying libwebp/Emscripten notices are in LICENSE-libwebp.txt. Playwright's Apache 2.0 license and NOTICE are included alongside them. Do not replace the binary without reviewing the ABI and rerunning encoder/quality tests.

The application-owned adapter is `tools/image-converter/codec.js`. Pinned ABI:
- exports f: memory; g: runtime constructors; h: webp_encode_rgba; i: webp_decode_rgba; j: webp_free; k: malloc; l: free; m: timeout runtime.
- encode arguments: RGBA pointer, width, height, quality, lossless flag, output-size pointer; return value is encoded buffer pointer.
- import module a: a interval timer (unused by libwebp), b heap growth, c process exit, d keepalive clear, e abort.
- heap growth is capped at 768 MiB by the adapter. Input dimensions have separate limits.

Lossless encodes preserve decoded image colors and alpha. Like standard libwebp lossless helpers, RGB under fully transparent pixels can be normalized; this changes no visible pixel. Browser decoding/canvas uses sRGB and may apply orientation/color conversion and premultiplied-alpha rounding before encoding. Original EXIF, ICC, XMP and other source metadata are not copied.

Chrome extension CSP permits this local WebAssembly module with `wasm-unsafe-eval`, while JavaScript sources remain local and ordinary `unsafe-eval` is not enabled. Documentation: https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
