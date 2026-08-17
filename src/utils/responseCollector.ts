import { expect, Page, Response } from '@playwright/test';

export interface ResponseCollector {
    /** Responses matched so far. */
    readonly responses: Response[];
    /** Resolves once at least `count` DISTINCT matching responses have arrived. */
    waitFor(count: number, timeout?: number): Promise<Response[]>;
    /** Detaches the listener (call it when the collector is abandoned early). */
    dispose(): void;
}

/**
 * Counts matching responses through a single listener.
 *
 * Registering N identical `page.waitForResponse(predicate)` promises does NOT wait for N
 * responses: one event notifies every listener at once, so all N resolve off the same
 * response. Bulk actions here fire one request per item, so they need real counting.
 *
 * Attach BEFORE the action that triggers the requests.
 */
export function collectResponses(page: Page, predicate: (response: Response) => boolean): ResponseCollector {
    const responses: Response[] = [];
    const listener = (response: Response) => {
        if (predicate(response)) responses.push(response);
    };
    page.on('response', listener);

    let detached = false;
    const dispose = () => {
        if (detached) return;
        page.off('response', listener);
        detached = true;
    };

    return {
        responses,
        async waitFor(count: number, timeout = 60_000): Promise<Response[]> {
            try {
                await expect
                    .poll(() => responses.length, {
                        timeout,
                        message: `Expected ${count} matching response(s)`,
                    })
                    .toBeGreaterThanOrEqual(count);
                return [...responses];
            } finally {
                dispose();
            }
        },
        dispose,
    };
}
