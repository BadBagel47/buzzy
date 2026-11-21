// Room code and session constants shared by the start page, the bridge, the viewer and both clients (#442).
// Firebase rooms have 4-character codes and network-kit rooms 6 (#408), so the length tells the two apart.
export const ROOM_CODE_LENGTH=4;
export const NK_CODE_LENGTH=6;
export const ROOM_CODE_PATTERN=/^[A-HJ-NP-Z2-9]{4}$/;
const NK_CODE_PATTERN=/^[A-HJ-NP-Z2-9]{6}$/;
export const isFirebaseCode=code=>ROOM_CODE_PATTERN.test(String(code||''));
export const isNetworkKitCode=code=>NK_CODE_PATTERN.test(String(code||''));
export const isRoomCode=code=>isFirebaseCode(code)||isNetworkKitCode(code);
// sessionStorage key for "the room this tab is in" ({code, role, name}); read after a reload.
export const SESSION_KEY='buzzy-spark-ui-session';
// The host's choice of room server for new rooms during the trial (#408): 'firebase' or 'network-kit'.
export const BACKEND_KEY='buzzy-room-server';
