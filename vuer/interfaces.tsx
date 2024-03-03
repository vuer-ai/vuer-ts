import { MutableRefObject, ReactNode } from 'react';

export type VuerProps<P = {}, E = unknown> = P & {
  _key?: string;
  _ref?: MutableRefObject<E>;
  children?: ReactNode | undefined
  [key: string]: unknown;
};

export type Matrix16T = [ number, number, number, number, number, number, number, number, number,
  number, number, number, number, number, number, number ];

export interface EventType {
  etype: string;
}

export interface ClientEvent<T = unknown | Record<string, unknown>> extends EventType {
  key?: string;
  value?: T;
}

export interface ServerEvent<T = unknown | Record<string, unknown>> extends EventType {
  data: T;
}

// server RPC requests has a uuid so that we know which respond correspond to it.
export interface ServerRPC extends ServerEvent {
  uuid: string;
  rtype: string;
}
