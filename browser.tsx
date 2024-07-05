import {render, type RenderableProps} from 'preact';
import {once} from '@quilted/events';
import {createThreadFromBrowserWebSocket} from '@quilted/threads';
import {
  RemoteRootRenderer,
  SignalRemoteReceiver,
  createRemoteComponentRenderer,
} from '@remote-dom/preact/host';
import '@preact/signals';

import type {RenderRPC} from './websockets.tsx';

// This is where we will store the UI from the websocket server
const receiver = new SignalRemoteReceiver();

// Create the web socket, let it connect
const websocket = new WebSocket('ws://localhost:8080/connect');
await once(websocket, 'open');
console.log('WebSocket connection established');

// Create a “thread” from the web socket, and give it the connection to
// start rendering the UI
const thread = createThreadFromBrowserWebSocket<{}, RenderRPC>(websocket);
await thread.render(receiver.connection);
console.log(
  'Received initial UI from the server',
  receiver.root.children.peek(),
);

// Render the remote UI to the page
const root = document.createElement('div');
document.body.append(root);

function Button({onClick, children}: RenderableProps<{onClick?(): void}>) {
  return (
    <button type="button" onClick={() => onClick?.()}>
      {children}
    </button>
  );
}

render(
  <RemoteRootRenderer
    receiver={receiver}
    components={new Map([['ui-button', createRemoteComponentRenderer(Button)]])}
  />,
  root,
);
