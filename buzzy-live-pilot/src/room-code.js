// Room code and session constants shared by the start page, the bridge, the viewer and the Firebase client (#442).
// Firebase rooms have 4-character codes; network-kit rooms will have 6 (#408), so the length tells the two apart.
export const ROOM_CODE_LENGTH=4;
export const ROOM_CODE_PATTERN=/^[A-HJ-NP-Z2-9]{4}$/;
export const isRoomCode=code=>ROOM_CODE_PATTERN.test(String(code||''));
// sessionStorage key for "the room this tab is in" ({code, role}); read after a reload.
export const SESSION_KEY='buzzy-spark-ui-session';
