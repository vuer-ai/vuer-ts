import { MutableRefObject, ReactNode } from 'react';

export type VuerProps<P = unknown, E = undefined> = P & {
  _key?: string;
  _ref?: MutableRefObject<E>;
  children?: ReactNode | undefined
  [key: string]: unknown;
};

export interface EventType {
  etype: string;
}

export interface ClientEvent extends EventType {
  key?: string;
  value?: unknown[] | unknown | Record<string, unknown>;
}

export interface ServerEvent extends EventType {
  data: unknown[] | unknown | Record<string, unknown>;
}

// server RPC requests has a uuid so that we know which respond correspond to it.
export interface ServerRPC extends ServerEvent {
  uuid: string;
  rtype: string;
}
