export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type Json = null | boolean | number | string | Json[] | { [prop: string]: Json }

export type QueryStringish = string | URLSearchParams | NodeJS.Dict<string | readonly string[]> | Iterable<[string, string]> | readonly [string, string][];

export type RequestOptions = {
    query: QueryStringish;
    body: Json;
    headers: Record<string, string>;
}