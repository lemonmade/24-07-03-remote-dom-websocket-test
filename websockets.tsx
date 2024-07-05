import * as http from 'node:http';
import WebSocket, {WebSocketServer} from 'ws';

import {createThread} from '@quilted/threads';

import '@remote-dom/core/polyfill';
import type {RemoteConnection} from '@remote-dom/core';
import {
  createRemoteElement,
  RemoteRootElement,
} from '@remote-dom/core/elements';

import {render, h} from 'preact';
import {useSignal, useComputed} from '@preact/signals';

// Define the interface between the websocket server and the client
export interface RenderRPC {
  render(connection: RemoteConnection): Promise<void>;
}

// Define the custom elements we will render “remotely”
const Button = createRemoteElement({
  properties: {
    onClick: {event: true},
  },
});

customElements.define('ui-button', Button);
customElements.define('remote-root', RemoteRootElement);

declare global {
  interface HTMLElementTagNameMap {
    'ui-button': InstanceType<typeof Button>;
    'remote-root': RemoteRootElement;
  }

  namespace JSX {
    interface IntrinsicElements {
      'ui-button': {onClick?(): void};
    }
  }
}

// Create the HTTP and WebSocket servers
const server = http.createServer((_req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('WebSocket server is running.');
});

const wss = new WebSocketServer({noServer: true});

// Handle WebSocket connections
wss.on('connection', (ws) => {
  const abort = new AbortController();

  createThread<RenderRPC>(
    {
      send(message) {
        ws.send(JSON.stringify(message));
      },
      listen(listener, {signal}) {
        const wrappedListener = (message: WebSocket.Data) => {
          listener(JSON.parse(message.toString()));
        };

        ws.on('message', wrappedListener);
        signal?.addEventListener(
          'abort',
          () => {
            ws.off('message', wrappedListener);
          },
          {once: true},
        );
      },
    },
    {
      expose: {
        async render(connection) {
          console.log('Rendering...');

          const root = document.createElement('remote-root');
          root.connect(connection);

          function App() {
            const count = useSignal(0);
            const text = useComputed(() => `Count: ${count.value}`);

            return h(
              'ui-button',
              {
                onClick: () => {
                  console.log('Button clicked');
                  count.value += 1;
                },
              },
              text,
            );
          }

          render(h(App, {}), root);

          console.log('Rendered initial UI');
          console.log(root.innerHTML);
        },
      },
      signal: abort.signal,
    },
  );

  ws.on('close', () => {
    abort.abort();
  });
});

// Upgrade HTTP server to support WebSocket
server.on('upgrade', (req, socket, head) => {
  const pathname = new URL(req.url!, `http://${req.headers.host}`).pathname;

  if (pathname === '/connect') {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log(
    `WebSocket server is listening on ws://localhost:${PORT}/connect`,
  );
});
