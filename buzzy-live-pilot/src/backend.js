// #408: the room's code decides its backend (4 characters Firebase, 6 network-kit); both clients have the same interface.
import {isNetworkKitCode} from './room-code.js';

export async function clientOf(networkKit){
 if(networkKit)return (await import('./nk-client.js')).getNkClient();
 return (await import('./client.js')).getClient();
}
export const clientFor=code=>clientOf(isNetworkKitCode(code));
