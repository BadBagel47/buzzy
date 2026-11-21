// #408: Buzzy's room server on network-kit. worker/index.js is deployed; worker/local.js is for local tests.
import {createRoomServer} from '../vendor/network-kit/server/index.js';
import options from '../rooms/options.js';

export function buzzyRooms({allowedOrigins}) {
  return createRoomServer({
    ...options,
    allowedOrigins,
    jurisdiction: (env) => env.ROOM_JURISDICTION || null,
    // The admin page (on/off, budget, notices); only when the service binding exists.
    admin: (env) => (env.NETWORK_KIT_ADMIN ? {binding: 'NETWORK_KIT_ADMIN', game: 'buzzy-rooms'} : null),
  });
}
