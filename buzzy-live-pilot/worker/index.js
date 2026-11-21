import {buzzyRooms} from './rooms.js';

const rooms = buzzyRooms({allowedOrigins: ['https://buzzy.trythis.one', 'https://buzzy-197dc.web.app', 'https://buzzy-197dc.firebaseapp.com']});
export const Room = rooms.RoomObject;
export default {fetch: rooms.fetch};
