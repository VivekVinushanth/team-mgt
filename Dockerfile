FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

# Next.js inlines NEXT_PUBLIC_* into the client bundle at BUILD time, so these
# have to be present here — setting them only as runtime env vars leaves the
# browser with `undefined` and Asgardeo sign-in fails. Server-side secrets
# (M2M client secret, GitHub PAT) are deliberately NOT build args: they stay
# runtime-only so they never land in an image layer.
ARG NEXT_PUBLIC_ASGARDEO_CLIENT_ID
ARG NEXT_PUBLIC_ASGARDEO_BASE_URL
ARG NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL
ARG NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL
ENV NEXT_PUBLIC_ASGARDEO_CLIENT_ID=$NEXT_PUBLIC_ASGARDEO_CLIENT_ID \
    NEXT_PUBLIC_ASGARDEO_BASE_URL=$NEXT_PUBLIC_ASGARDEO_BASE_URL \
    NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL=$NEXT_PUBLIC_ASGARDEO_SIGN_IN_REDIRECT_URL \
    NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL=$NEXT_PUBLIC_ASGARDEO_SIGN_OUT_REDIRECT_URL

RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app ./

# Choreo's Dockerfile scan rejects images that run as root: it requires a
# non-root USER with a numeric UID in the 10000-20000 range. The app also
# writes its JSON stores under /app/data at runtime, so the same user needs
# to own the tree.
RUN addgroup -g 10001 -S nodejs \
    && adduser -u 10001 -S nextjs -G nodejs \
    && chown -R 10001:10001 /app
USER 10001

EXPOSE 3000
CMD ["npm", "start"]
