# Remote DOM WebSocket example

This example shows how you can use Remote DOM over web sockets. In this case, the “host” environment is the HTML page that creates a `WebSocket` connection (mostly contained in [`browser.tsx`](/browser.tsx)), and the “remote” environment (the one that decides _what_ to render) is the socket server (contained in [`websockets.tsx`](/websockets.tsx)).

This example uses Preact on both the host and remote environments, but you can use any library you want.

To try this example out, run the following commands, which run both the web app and socket servers in parallel:

```sh
pnpm install
pnpm run develop
```
