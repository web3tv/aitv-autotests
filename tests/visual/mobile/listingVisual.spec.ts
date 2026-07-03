import { test } from '@playwright/test';
import { registerListingVisualTests } from '../shared/listingVisualScenarios';

test.describe('Listing pages mobile visual tests', () => {
    registerListingVisualTests('VIS-LIST-MOB');
});
