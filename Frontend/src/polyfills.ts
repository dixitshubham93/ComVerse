import { Buffer } from 'buffer';
import process from 'process';
import util from 'util';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = process;
  (window as any).util = util;
  
  // simple-peer expects process.nextTick
  if (!(window as any).process.nextTick) {
    (window as any).process.nextTick = function(cb: any, ...args: any[]) {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(() => cb(...args));
      } else {
        Promise.resolve().then(() => cb(...args));
      }
    };
  }
}
