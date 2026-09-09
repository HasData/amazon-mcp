// Tool contract test.
//
// The README promises four tools with specific names and required parameters. The upstream list
// can change without a single commit here, and the README would start lying silently. These
// checks catch that before a user does.
//
// The server also lists a fifth tool, the reviews one, whose upstream endpoint is retired. It is
// deliberately absent from the README, and the last test pins that state instead of ignoring it:
// if the endpoint comes back, or the server stops listing it, the run goes red and the README
// needs a decision rather than a silent drift.
//
// One test calls a tool for real. Listing tools accepts any non-empty key, so a contract check
// that only lists tools stays green with a revoked or mistyped key. That call costs 5 credits,
// which is the price of a canary that can fail for the right reason.
//
// Run: HASDATA_API_KEY=your_key_here npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

const ENDPOINT = 'https://mcp.hasdata.com/api/mcp?apis=amazon';
const KEY = process.env.HASDATA_API_KEY;
const TIMEOUT_MS = 30_000;

const EXPECTED = {
    hasdata_amazon_search_getSearchResults: ['q'],
    hasdata_amazon_product_getProductDetails: ['asin'],
    hasdata_amazon_seller_getSellerDetails: ['sellerId'],
    hasdata_amazon_seller_products_getSellerProducts: ['sellerId'],
};

// Listed by the server, retired upstream. Not documented in the README on purpose.
const RETIRED = {
    hasdata_amazon_reviews_getProductReviews: ['asin'],
};

// A streamable HTTP body arrives either as plain JSON or as server-sent events. One SSE event
// can span several data: lines, several events can share one response, and a server is free to
// send progress notifications before the answer. So collect every event and pick the message
// carrying our request id instead of trusting the first data: line.
function parseRpc(raw, id) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) return JSON.parse(trimmed);

    const messages = [];
    for (const event of trimmed.split(/\r?\n\r?\n+/)) {
        const data = event
            .split(/\r?\n/)
            .filter((l) => l.startsWith('data:'))
            .map((l) => l.slice(5).replace(/^ /, ''))
            .join('\n');
        if (!data || data === '[DONE]') continue;
        try {
            messages.push(JSON.parse(data));
        } catch {
            // A keep-alive or a partial event is not our response.
        }
    }
    assert.ok(messages.length, `no JSON-RPC message in the response: ${raw.slice(0, 300)}`);
    const match = messages.find((m) => m.id === id);
    assert.ok(match, `no message with id ${id} in the response: ${raw.slice(0, 300)}`);
    return match;
}

let nextId = 1;

async function rpc(method, params = {}) {
    // The CI key sits on the free plan, where concurrency is 1. When several of
    // these repos are pushed at once their contract runs collide, and HasData
    // answers 429 with code concurrency_limit straight away rather than queueing.
    // That is a plan limit, not a broken contract, so the call is retried before
    // the test gives up. A 401 still fails on the first attempt.
    for (let attempt = 1; ; attempt++) {
        const id = nextId++;
        const res = await fetch(ENDPOINT, {
            method: 'POST',
            headers: {
                'x-api-key': KEY,
                'Content-Type': 'application/json',
                // The server answers over streamable HTTP, so accept both a plain body and a stream.
                Accept: 'application/json, text/event-stream',
            },
            body: JSON.stringify({ jsonrpc: '2.0', id, method, params }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        assert.equal(res.status, 200, `${method} returned ${res.status}`);
        const raw = await res.text();
        if (raw.includes('concurrency_limit') && attempt < 5) {
            await new Promise((r) => setTimeout(r, attempt * 4000));
            continue;
        }
        return { raw, body: parseRpc(raw, id) };
    }
}

// One network round trip for every test that needs the list.
let toolsPromise;
function listTools() {
    toolsPromise ??= rpc('tools/list').then(({ body }) => {
        assert.ok(body.result?.tools, 'the response carried no result.tools');
        return body.result.tools;
    });
    return toolsPromise;
}

const live = { skip: KEY ? false : 'HASDATA_API_KEY is not set, skipping the live checks' };

const ALL = { ...EXPECTED, ...RETIRED };

test('apis=amazon exposes the documented tools and nothing else', live, async () => {
    const tools = await listTools();
    const names = tools.map((t) => t.name).sort().join(', ');
    assert.equal(
        tools.length,
        Object.keys(ALL).length,
        `expected ${Object.keys(ALL).length} tools, got ${tools.length}: ${names}`
    );
});

test('the tool names have not changed', live, async () => {
    const tools = await listTools();
    const names = new Set(tools.map((t) => t.name));
    for (const expected of Object.keys(ALL)) {
        assert.ok(names.has(expected), `tool ${expected} is missing from the list`);
    }
});

test('every tool still declares its required parameter', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        const required = tool.inputSchema?.required ?? [];
        const want = ALL[tool.name];
        assert.ok(want, `tool ${tool.name} is not covered by this test`);
        for (const param of want) {
            assert.ok(
                required.includes(param),
                `${tool.name} should require ${param}, declares: ${required.join(', ') || 'nothing'}`
            );
        }
    }
});

test('every tool carries a description', live, async () => {
    const tools = await listTools();
    for (const tool of tools) {
        assert.ok(
            (tool.description || '').trim().length > 20,
            `${tool.name} has an empty or near-empty description`
        );
    }
});

test('the key is accepted by HasData', live, async () => {
    const { raw } = await rpc('tools/call', {
        name: 'hasdata_amazon_search_getSearchResults',
        arguments: { q: 'laptop stand' },
    });
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(!raw.includes('"isError":true'), `the tool call failed: ${raw.slice(0, 300)}`);
});

// The reviews endpoint is retired upstream and answers 400. The README does not document the
// tool for that reason. This check exists so the omission stays deliberate: the day the call
// succeeds, or the day the server drops the tool, this fails and the README gets revisited.
test('the retired reviews tool still answers with an error', live, async () => {
    const { raw } = await rpc('tools/call', {
        name: 'hasdata_amazon_reviews_getProductReviews',
        arguments: { asin: 'B0DHJ7SBDR' },
    });
    assert.ok(!raw.includes('401 Unauthorized'), 'HasData rejected the key');
    assert.ok(
        raw.includes('"isError":true'),
        'the reviews endpoint answered successfully. It is retired upstream and left out of the '
        + 'README on that basis, so document it again or drop this test.'
    );
});
