import Pusher from 'pusher-js';

let pusher;

export function getPusherClient() {
  if (!pusher) {
    pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      forceTLS: true,
    });
  }
  return pusher;
}