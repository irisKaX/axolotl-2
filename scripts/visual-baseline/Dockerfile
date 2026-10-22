# Same build/test environment locally and in existing preview CI; no UI source.
FROM node:24.19.0-trixie-slim@sha256:ab3eebe934147fee049b5eb83c570f68c849a13c930bdfa482de99fcdfa3b3de
COPY runtime-packages.lock /tmp/runtime-packages.lock
RUN --mount=type=secret,id=proxy_ca \
    if [ -f /run/secrets/proxy_ca ]; then printf 'Acquire::https::CaInfo "/run/secrets/proxy_ca";\n' > /etc/apt/apt.conf.d/99-session-ca; fi; \
    apt-get update && xargs apt-get install -y --no-install-recommends < /tmp/runtime-packages.lock \
    && apt-get install -y --no-install-recommends git python3 curl ca-certificates xz-utils \
    && rm -f /etc/apt/apt.conf.d/99-session-ca && rm -rf /var/lib/apt/lists/*
RUN --mount=type=secret,id=proxy_ca     if [ -f /run/secrets/proxy_ca ]; then printf 'Acquire::https::CaInfo "/run/secrets/proxy_ca";\n' > /etc/apt/apt.conf.d/99-session-ca; fi;     apt-get update && apt-get install -y --no-install-recommends texlive-fonts-recommended=2024.20250309-1     && rm -f /etc/apt/apt.conf.d/99-session-ca && rm -rf /var/lib/apt/lists/*
COPY fonts.conf /opt/axolotl-fonts.conf
COPY runtime /tmp/browser-runtime
RUN cd /tmp/browser-runtime && sha256sum --check SHA256SUMS \
    && cat chromium-154.tar.xz.part1 chromium-154.tar.xz.part2 | tar -xJf - -C / \
    && rm -rf /tmp/browser-runtime
ENV PLAYWRIGHT_CHROME_EXECUTABLE=/usr/lib/chromium/chromium \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    XDG_CACHE_HOME=/tmp/axolotl-test-cache \
    FONTCONFIG_FILE=/opt/axolotl-fonts.conf
