import { getTestDir, getStats, getDatasetItems, run, expect, validateDataset } from '../../tools.mjs';

const testDir = getTestDir(import.meta.url);

const { exit } = process;
process.exit = () => {};

await run(testDir, 'web-scraper', {
    startUrls: [{
        url: 'https://badssl.com/',
        method: 'GET',
        userData: { label: 'START' },
    }],
    keepUrlFragments: false,
    linkSelector: '.group a.bad',
    pseudoUrls: [{
        purl: 'https://[.+].badssl.com/',
        method: 'GET',
        userData: { label: 'DETAIL' },
    }],
    pageFunction: async function pageFunction(context) {
        const { request: { userData: { label } } } = context;

        switch (label) {
            case 'START': return handleStart(context);
            case 'DETAIL': return handleDetail(context);
        }

        async function handleStart({ log }) {
            log.info('Bad ssl page opened!');
        }

        async function handleDetail({ request, log, jQuery: $ }) {
            const { url } = request;
            log.info(`Scraping ${url}`);
            const title = $('title').text();
            return { url, title };
        }
    },
    injectJQuery: true,
    injectUnderscore: false,
    proxyConfiguration: { useApifyProxy: false },
    proxyRotation: 'RECOMMENDED',
    useChrome: false,
    ignoreSslErrors: false,
    ignoreCorsAndCsp: false,
    downloadMedia: true,
    downloadCss: true,
    waitUntil: ['networkidle2'],
    debugLog: false,
    browserLog: false,
});

process.exit = exit;

const stats = await getStats(testDir);
await expect(stats.requestsFinished > 5 && stats.requestsFinished < 10, 'All requests finished');
await expect(stats.requestsFailed > 20 && stats.requestsFailed < 30, 'Number of failed requests');

const datasetItems = await getDatasetItems(testDir);
await expect(datasetItems.length >= 5 && datasetItems.length < 10, 'Number of dataset items');
await expect(validateDataset(datasetItems, ['url', 'title']), 'Dataset items validation');

process.exit(0);
