import { Buffer } from 'buffer';
import process from 'process';
import util from 'util';

if (typeof window !== 'undefined') {
  (window as any).global = window;
  (window as any).Buffer = Buffer;
  (window as any).process = process;
  (window as any).util = util;
}
