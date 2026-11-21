// Local tests only (wrangler dev with wrangler.local.jsonc): any page on this machine may connect.
import {buzzyRooms} from './rooms.js';

const rooms = buzzyRooms({allowedOrigins: '*'});
export const Room = rooms.RoomObject;
export default {fetch: rooms.fetch};
