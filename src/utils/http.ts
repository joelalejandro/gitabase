import fetch from 'node-fetch';
import { URLSearchParams }from 'url';
import { HttpMethod, Json, RequestOptions } from '../../types/http';
import debug from 'debug';

const log = debug('gitabase:http');

const request = async <T = Json>(url: string, method: HttpMethod = 'GET', { query, body, headers }: Partial<RequestOptions> = {}) => {
    let requestUrl = url;
    
    if (query) {
        const queryParameters = new URLSearchParams(query).toString();
        requestUrl += `?${queryParameters}`;
    }

    let requestBody = '';

    if (method === 'POST' || method === 'PUT') {
        requestBody = JSON.stringify(body);
    }

    log('=> %s %s %o', method, requestUrl, requestBody);
    const response = await fetch(requestUrl, {
        method,
        ...(requestBody ? { body: requestBody } : {}),
        headers: {
            'content-type': 'application/json',
            ...headers,
        },
    });

    const json = await response.json();

    log('<= %o', json);
    
    return json as T;
};

export { request };